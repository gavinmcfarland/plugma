import type { PluginOptions, ResultsOfTask } from '../core/types.js'
import { createViteConfigs } from '../utils/config/create-vite-configs.js'
import { notifyInvalidManifestOptions } from '../utils/config/notify-invalid-manifest-options.js'
import { Logger } from '../utils/log/logger.js'
import { access } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { type InlineConfig, build, mergeConfig } from 'vite'
import { GetFilesTask } from '../tasks/get-files.js'
import { task } from '../tasks/runner.js'
import { viteState } from '../utils/vite-state-manager.js'
import { loadConfig } from '../utils/config/load-config.js'
import { getUserFiles } from '../utils/get-user-files.js'
import { renameIndexHtml } from '../vite-plugins/rename-index-html.js'
import { Timer } from '../utils/timer.js'
import chalk from 'chalk'
import { colorStringify } from '../utils/cli/colorStringify.js'

interface BuildUiResult {
	outputPath: string
	duration?: string
}

interface ViteConfigOptions {
	options: PluginOptions
	viteConfigs: any
	userUIConfig: any
}

// Create a more accurate type for our watcher wrapper
export interface BuildWatcherWrapper {
	close: () => Promise<void>
	config: InlineConfig
	watcher: any
}

// Helper function to check if file exists
async function fileExists(path: string): Promise<boolean> {
	return access(path)
		.then(() => true)
		.catch(() => false)
}

async function runWatchMode({ options, viteConfigs, userUIConfig }: ViteConfigOptions): Promise<void> {
	const watchConfig = mergeConfig(
		viteConfigs.ui.build,
		mergeConfig(
			{
				configFile: false,
				build: {
					...viteConfigs.ui.build.build,
					watch: {},
					outDir: join(options.output),
				},
				plugins: [renameIndexHtml()],
			},
			userUIConfig?.config ?? {},
		),
	)

	// console.log('build ui config', colorStringify(watchConfig, 2))

	const watcher = await build(watchConfig)

	if ('close' in watcher) {
		viteState.viteUi.setInstance({
			close: async () => {
				if (watcher) {
					await watcher.close()
				}
			},
			config: watchConfig,
			watcher: watcher,
		})
		return
	}

	throw new Error('Failed to create watcher')
}

// Improved build mode configuration
async function runBuild({ options, viteConfigs, userUIConfig }: ViteConfigOptions): Promise<void> {
	const buildConfig = mergeConfig(
		viteConfigs.ui.build,
		mergeConfig(
			{
				configFile: false,
				plugins: [renameIndexHtml()],
			},
			userUIConfig?.config ?? {},
		),
	)

	await build(buildConfig)
}

// Helper to handle build success logging
async function logBuildSuccess(logger: Logger, duration: string, currentFiles: any) {
	if (currentFiles.manifest.main) {
		const mainExists = await fileExists(resolve(currentFiles.manifest.main))
		const uiExists = !currentFiles.manifest.ui || (await fileExists(resolve(currentFiles.manifest.ui)))

		if (mainExists && uiExists) {
			logger.success(`ui created in ${duration}ms`)
		}
	}
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

export const BuildUiTask = task(
	'build:ui',
	async (options: any, context: ResultsOfTask<GetFilesTask>): Promise<BuildUiResult> => {
		const logger = new Logger({
			debug: options.debug,
			prefix: 'build:ui',
		})

		try {
			const currentFiles = await getUserFiles(options)
			const outputPath = join(options.output, 'ui.html')

			await viteState.viteUi.close()

			const timer = new Timer()

			if (!currentFiles.manifest.ui) {
				logger.debug('No UI specified in manifest, skipping build')
				return { outputPath }
			}

			const uiPath = resolve(currentFiles.manifest.ui)
			if (!(await fileExists(uiPath))) {
				console.error(`UI file not found at ${uiPath}, skipping build`)
				return { outputPath }
			}

			const viteConfigs = createViteConfigs(options, currentFiles)
			const userUIConfig = await loadConfig('vite.config.ui', options, 'ui')
			const configOptions = { options, viteConfigs, userUIConfig }

			if (options.command === 'build' && options.watch) {
				logger.text(`${chalk.bgGreenBright('[build-ui]')} Watching for changes`)
				runWatchMode(configOptions)
			} else {
				timer.start()
				await runBuild(configOptions)
				timer.stop()

				if (timer.getDuration()) {
					await logBuildSuccess(logger, timer.getDuration()!, currentFiles)
				}
			}

			await notifyInvalidManifestOptions(options, currentFiles, 'plugin-built')

			const duration = timer.getDuration()
			return { outputPath, duration }
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err))
			error.message = `Failed to build UI: ${error.message}`
			logger.debug(error)
			throw error
		}
	},
)
