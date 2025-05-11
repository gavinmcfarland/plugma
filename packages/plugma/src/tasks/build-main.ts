import { join, resolve } from 'node:path'
import type { RollupWatcher } from 'rollup'
import { build, mergeConfig } from 'vite'
import { colorStringify } from '../utils/cli/colorStringify.js'
/**
 * Main script build task implementation
 */
import type { GetTaskTypeFor, PluginOptions, ResultsOfTask } from '../core/types.js'
import { createViteConfigs } from '../utils/config/create-vite-configs.js'
import { Logger } from '../utils/log/logger.js'
import { GetFilesTask } from '../tasks/get-files.js'
import { task } from '../tasks/runner.js'
import { viteState } from '../utils/vite-state-manager.js'
import { loadConfig } from '../utils/config/load-config.js'
import { getUserFiles } from '../utils/get-user-files.js'
import { access } from 'node:fs/promises'
import { Timer } from '../utils/timer.js'
import chalk from 'chalk'

/**
 * Result type for the build-main task
 */
interface BuildMainResult {
	/** Path to the built main script file */
	outputPath: string
	duration?: string
}

interface ViteConfigOptions {
	options: PluginOptions
	viteConfigs: any
	userMainConfig: any
}

// Helper function to check if file exists
async function fileExists(path: string): Promise<boolean> {
	return access(path)
		.then(() => true)
		.catch(() => false)
}

async function runWatchMode({ options, viteConfigs, userMainConfig }: ViteConfigOptions): Promise<void> {
	const config = options.command === 'build' ? viteConfigs.main.build : viteConfigs.main.dev

	const watchConfig = mergeConfig(
		{
			configFile: false,
			...config,
			build: {
				...config.build,
				watch: {},
			},
		},
		userMainConfig?.config ?? {},
	)

	// console.log('devmain config', colorStringify(watchConfig, 2))

	const buildResult = await build(watchConfig)

	// Handle both array and single watcher cases
	if (Array.isArray(buildResult)) {
		const watcher = buildResult[0]
		if (watcher && typeof watcher === 'object' && 'close' in watcher) {
			await viteState.viteMain.setInstance(watcher as unknown as RollupWatcher)
			return
		}
	} else if (typeof buildResult === 'object' && 'close' in buildResult) {
		await viteState.viteMain.setInstance(buildResult as unknown as RollupWatcher)
		return
	}

	throw new Error('Failed to create watcher')
}

async function runBuild({ options, viteConfigs, userMainConfig }: ViteConfigOptions): Promise<void> {
	const config = options.command === 'build' ? viteConfigs.main.build : viteConfigs.main.dev

	const buildConfig = mergeConfig(
		{
			configFile: false,
			...config,
		},
		userMainConfig?.config ?? {},
	)

	// console.log('build main config', colorStringify(buildConfig, 2))

	await build(buildConfig)
}

// Helper to handle build success logging
async function logBuildSuccess(logger: Logger, duration: string, files: any) {
	if (files.manifest.main) {
		const mainExists = await fileExists(resolve(files.manifest.main))
		if (mainExists) {
			logger.success(`main created in ${duration}ms`)
		}
	}
}

/**
 * Task that builds the plugin's main script.
 *
 * This task is responsible for:
 * 1. Building the main script using Vite:
 *    - Configures Vite for CommonJS output format
 *    - Sets up Figma API externals
 *    - Handles source maps and minification
 * 2. Managing build state:
 *    - Closes existing build server if any
 *    - Validates output files against source files
 *    - Manages watch mode for development
 *
 * The main script is built from the path specified in manifest.main and outputs to main.js.
 * In development mode:
 * - Builds are not minified for better debugging
 * - Watch mode is enabled for rebuilding on changes
 * - Output files are validated against source files
 *
 * In production mode:
 * - Output is minified
 * - Watch mode is disabled (unless explicitly enabled)
 * - Build artifacts are preserved
 *
 * @param options - Plugin build options including command, output path, etc
 * @param context - Task context containing results from previous tasks
 * @returns Object containing the output file path
 */
export const BuildMainTask = task('build:main', async (options: any): Promise<BuildMainResult> => {
	const logger = new Logger({
		debug: options.debug,
		prefix: 'build:main',
	})

	try {
		const files = await getUserFiles(options)
		const outputPath = join(options.output || 'main.js')
		const timer = new Timer()

		await viteState.viteMain.close()

		if (!files.manifest.main) {
			logger.debug('No main script specified in manifest, build skipped')
			return { outputPath }
		}

		const mainPath = resolve(files.manifest.main)
		if (!(await fileExists(mainPath))) {
			console.error(`Main script not found at ${mainPath}, skipping build`)
			return { outputPath }
		}

		logger.debug(`Building main script from: ${mainPath}`)

		const viteConfigs = createViteConfigs(options, files)

		const userMainConfig = await loadConfig('vite.config.main', options, 'main')
		const configOptions = { options, viteConfigs, userMainConfig }

		if (options.watch || ['dev', 'preview'].includes(options.command ?? '')) {
			logger.text(`${chalk.bgGreenBright('[build-main]')} Watching for changes`)
			await runWatchMode(configOptions)
		} else {
			timer.start()
			await runBuild(configOptions)
			timer.stop()

			// if (timer.getDuration()) {
			// 	await logBuildSuccess(logger, timer.getDuration()!, files)
			// }
		}

		const duration = timer.getDuration()
		return { outputPath, duration }
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error))
		err.message = `Failed to build main script: ${err.message}`
		logger.debug(err)
		throw err
	}
})
