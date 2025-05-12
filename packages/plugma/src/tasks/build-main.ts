import { resolve } from 'node:path'
import type { RollupWatcher } from 'rollup'
import { build, mergeConfig } from 'vite'
import type { PluginOptions } from '../core/types.js'
import { createViteConfigs } from '../utils/config/create-vite-configs.js'
import { viteState } from '../utils/vite-state-manager.js'
import { loadConfig } from '../utils/config/load-config.js'
import { getUserFiles } from '../utils/get-user-files.js'
import { access } from 'node:fs/promises'
import { Timer } from '../utils/timer.js'
import { ListrLogLevels, ListrTask, Listr } from 'listr2'
import { BuildCommandOptions, DevCommandOptions, PreviewCommandOptions } from '../utils/create-options.js'
import { createDebugAwareLogger } from '../utils/debug-aware-logger.js'
import { colorStringify } from '../utils/cli/colorStringify.js'

export interface BuildMainResult {
	/** Path to the built main script file */
	outputPath: string
	duration?: string
}

interface BuildMainContext {
	mainDuration?: number
	files?: any
	mainPath?: string
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
	const logger = createDebugAwareLogger(options.debug)

	const watchConfig = mergeConfig(
		{
			configFile: false,
			...config,
			build: {
				...config.build,
				watch: {},
				ssr: {
					noExternal: ['child_process', 'util'],
				},
			},
		},
		userMainConfig?.config ?? {},
	)

	logger.log(ListrLogLevels.OUTPUT, 'Logging config')
	if (options.debug) {
		console.log(colorStringify(watchConfig, 2))
	}

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

/**
 * Creates a listr2 task for building the main script
 */
export const createBuildMainTask = <T extends BuildMainContext>(
	options: DevCommandOptions | BuildCommandOptions | PreviewCommandOptions,
): ListrTask<T> => {
	const logger = createDebugAwareLogger(options.debug)
	return {
		title: 'Build Main',
		task: (ctx, task) => {
			const timer = new Timer()

			return task.newListr(
				[
					{
						title: 'Get user files',
						task: async () => {
							const files = await getUserFiles(options)
							ctx.files = files
							return files
						},
					},
					{
						title: 'Check main script',
						task: async (ctx) => {
							if (!ctx.files.manifest.main) {
								logger.log(
									ListrLogLevels.SKIPPED,
									'No main script specified in manifest, build skipped',
								)
								return task.skip('No main script specified')
							}

							const mainPath = resolve(ctx.files.manifest.main)
							if (!(await fileExists(mainPath))) {
								logger.log(
									ListrLogLevels.SKIPPED,
									`Main script not found at ${mainPath}, skipping build`,
								)
								return task.skip('Main script not found')
							}

							if (options.debug) {
								logger.log(ListrLogLevels.OUTPUT, `Building main script from: ${mainPath}`)
							}

							ctx.mainPath = mainPath
						},
					},
					{
						title: 'Build main script',
						task: async (ctx) => {
							await viteState.viteMain.close()

							const viteConfigs = createViteConfigs(options, ctx.files)
							const userMainConfig = await loadConfig('vite.config.main', options, 'main')
							const configOptions = { options, viteConfigs, userMainConfig }

							if (options.watch || ['dev', 'preview'].includes(options.command ?? '')) {
								await runWatchMode(configOptions)
							} else {
								timer.start()
								await runBuild(configOptions)
								timer.stop()

								const duration = timer.getDuration()
								if (duration) {
									ctx.mainDuration = parseInt(duration)
								}
							}
						},
					},
				],
				{
					concurrent: false,
					exitOnError: true,
				},
			)
		},
	}
}
