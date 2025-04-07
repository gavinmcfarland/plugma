import type { GetTaskTypeFor, PluginOptions, ResultsOfTask } from '#core/types.js'
import { createViteConfigs } from '#utils/config/create-vite-configs.js'
import { validateOutputFiles } from '#utils/config/validate-output-files.js'
import { Logger } from '#utils/log/logger.js'
import { access } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import type { ViteDevServer } from 'vite'
import { type InlineConfig, build, mergeConfig } from 'vite'
import { GetFilesTask } from '../common/get-files.js'
import { task } from '../runner.js'
import { viteState } from '../server/vite.js'
import { loadConfig } from '#utils/config/load-config.js'
/**
 * Result type for the build-ui task
 */
interface Result {
	/** Path to the built UI HTML file */
	outputPath: string
	/** Build duration in milliseconds */
	duration?: string
}

/**
 * Task that builds the plugin's UI interface.
 *
 * This task is responsible for:
 * 1. Building the UI using Vite:
 *    - Configures Vite for IIFE output format
 *    - Handles source maps and minification
 *    - Manages HTML and JS output
 * 2. Managing build state:
 *    - Closes existing UI server if any
 *    - Validates output files against source files
 *    - Manages watch mode for development
 *    - Ensures output integrity
 *
 * The UI is built from the path specified in manifest.ui and outputs to ui.html.
 * In development mode:
 * - Source maps are enabled for better debugging
 * - Watch mode is enabled for rebuilding on changes
 * - Output files are validated against source files
 *
 * In production mode:
 * - Output is minified
 * - Watch mode is disabled
 * - Build artifacts are preserved
 *
 * @param options - Plugin build options including command, output path, etc
 * @param context - Task context containing results from previous tasks
 * @returns Object containing the output file path and build duration
 */
const buildUi = async (options: PluginOptions, context: ResultsOfTask<GetFilesTask>): Promise<Result> => {
	const logger = new Logger({
		debug: options.debug,
		prefix: 'build:ui',
	})

	try {
		logger.debug('Starting build:ui task...')

		const fileResult = context[GetFilesTask.name]
		if (!fileResult) {
			throw new Error('get-files task must run first')
		}

		const { files } = fileResult
		const outputPath = join(options.output || 'dist', 'ui.html')

		logger.debug('Task context:', {
			files: {
				manifest: files.manifest,
				userPkgJson: files.userPkgJson,
			},
			outputPath,
		})

		// Close existing UI server if any
		if (viteState.viteUi) {
			logger.debug('Closing existing UI server...')
			await viteState.viteUi.close()
			logger.debug('UI server closed')
		}

		// Get Vite config from createConfigs
		logger.debug('Creating Vite configs...')
		const configs = createViteConfigs(options, files)
		logger.debug('Vite configs created')
		const userUIConfig = await loadConfig('vite.config.ui', options)

		// Start build timer as close to build as possible
		const startTime = performance.now()

		// Only build if UI is specified and file exists
		if (files.manifest.ui) {
			const uiPath = resolve(files.manifest.ui)
			logger.debug('Checking UI file existence:', uiPath)
			const uiExists = await access(uiPath)
				.then(() => true)
				.catch(() => false)

			if (uiExists) {
				logger.debug(`Building UI from ${files.manifest.ui}...`)

				// Build UI with Vite
				if (options.command === 'build' && options.watch) {
					logger.debug('Starting UI build in watch mode...')
					const watchConfig = mergeConfig(
						{
							...configs.ui.build,
							configFile: false,
							build: {
								watch: {},
								minify: true,
								outDir: join(options.output),
								emptyOutDir: false,
							},
						},
						userUIConfig?.config ?? {},
					) as InlineConfig

					logger.debug('Watch config:', watchConfig)
					const watcher = await build(watchConfig)
					logger.debug('Watch build completed')

					if ('close' in watcher) {
						viteState.viteUi = {
							close: async () => {
								await watcher.close()
							},
							config: watchConfig,
							pluginContainer: {} as any,
							middlewares: {} as any,
							httpServer: null,
							watcher: watcher as any,
							ws: null as any,
							moduleGraph: null as any,
							transformRequest: null as any,
							transformIndexHtml: null as any,
							transformCode: null as any,
							resolvedUrls: null as any,
							ssrTransform: null as any,
							listen: async () => ({ port: 0 }),
							printUrls: () => {},
							bindCLIShortcuts: () => {},
							restart: async () => {},
						} as any as ViteDevServer
					}
				} else {
					const buildConfig = mergeConfig(
						{
							...configs.ui.build,
							configFile: false,
							build: {
								minify: true,
								outDir: join(options.output),
								emptyOutDir: false,
							},
						},
						userUIConfig?.config ?? {},
					) as InlineConfig

					logger.debug('Build config:', buildConfig)
					await build(buildConfig)
					logger.debug('Production build completed')
				}
			} else {
				logger.debug(`UI file not found at ${uiPath}, skipping build`)
			}
		} else {
			logger.debug('No UI specified in manifest, skipping build')
		}

		// Calculate elapsed time in milliseconds
		const endTime = performance.now()
		const duration = (endTime - 250 - startTime).toFixed(0) // Remove decimals for a Vite-like appearance

		// Show build status
		if (
			!options.watch &&
			files.manifest.main &&
			(await access(resolve(files.manifest.main))
				.then(() => true)
				.catch(() => false))
		) {
			if (
				!files.manifest.ui ||
				(files.manifest.ui &&
					(await access(resolve(files.manifest.ui))
						.then(() => true)
						.catch(() => false)))
			) {
				logger.success(`build created in ${duration}ms\n`)
			}
		}

		// Validate output files
		logger.debug('Validating output files...')
		await validateOutputFiles(options, files, 'plugin-built')
		logger.debug('Output files validated')

		// Check if ui.html file exists when debugging this task
		if (process.env.PLUGMA_DEBUG_TASK === 'build:ui') {
			try {
				const uiHtmlPath = join(options.output || 'dist', 'ui.html')
				const uiHtmlExists = await access(uiHtmlPath)
					.then(() => true)
					.catch(() => false)
				if (uiHtmlExists) {
					logger.debug('✓ Verified ui.html exists at:', uiHtmlPath)
				} else {
					logger.debug('✗ ui.html was not created at:', uiHtmlPath)
				}
			} catch (err) {
				logger.debug('Error checking ui.html file:', err)
			}
		}

		return { outputPath, duration }
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err))
		error.message = `Failed to build UI: ${error.message}`
		logger.debug(error)
		throw error
	}
}

export const BuildUiTask = task('build:ui', buildUi)
export type BuildUiTask = GetTaskTypeFor<typeof BuildUiTask>

export default BuildUiTask
