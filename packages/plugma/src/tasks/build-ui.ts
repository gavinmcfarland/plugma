import type { PluginOptions } from '../core/types.js'
import { createViteConfigs } from '../utils/config/create-vite-configs.js'
import { notifyInvalidManifestOptions } from '../utils/config/notify-invalid-manifest-options.js'
import { access } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { type InlineConfig, build, mergeConfig } from 'vite'
import { viteState } from '../utils/vite-state-manager.js'
import { loadConfig } from '../utils/config/load-config.js'
import { getUserFiles } from '../utils/get-user-files.js'
import { renameIndexHtml } from '../vite-plugins/rename-index-html.js'
import { Timer } from '../utils/timer.js'
import { ListrLogLevels, ListrTask } from 'listr2'
import { BuildCommandOptions, DevCommandOptions, PreviewCommandOptions } from '../utils/create-options.js'
import { createDebugAwareLogger } from '../utils/debug-aware-logger.js'
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

/**
 * Creates a listr2 task for building the UI
 */
export const createBuildUiTask = <T extends { uiDuration?: number }>(
	options: DevCommandOptions | BuildCommandOptions | PreviewCommandOptions,
): ListrTask<T> => {
	return {
		title: 'Build UI',
		task: async (ctx, task) => {
			const logger = createDebugAwareLogger(options.debug)

			try {
				const currentFiles = await getUserFiles(options)
				const outputPath = join(options.output, 'ui.html')

				await viteState.viteUi.close()

				const timer = new Timer()

				if (!currentFiles.manifest.ui) {
					logger.log(ListrLogLevels.SKIPPED, 'No UI specified in manifest, skipping build')
					return ctx
				}

				const uiPath = resolve(currentFiles.manifest.ui)
				if (!(await fileExists(uiPath))) {
					console.error(`UI file not found at ${uiPath}, skipping build`)
					return ctx
				}

				const viteConfigs = createViteConfigs(options, currentFiles)
				const userUIConfig = await loadConfig('vite.config.ui', options, 'ui')
				const configOptions = { options, viteConfigs, userUIConfig }

				if (options.command === 'build' && options.watch) {
					logger.log(ListrLogLevels.OUTPUT, `Watching for changes`)
					runWatchMode(configOptions)
				} else {
					timer.start()
					await runBuild(configOptions)
					timer.stop()
				}

				await notifyInvalidManifestOptions(options, currentFiles, 'plugin-built')

				const duration = timer.getDuration()
				if (duration) {
					ctx.uiDuration = parseInt(duration)
				}

				return ctx
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err))
				error.message = `Failed to build UI: ${error.message}`
				logger.log(ListrLogLevels.FAILED, error.message)
				throw error
			}
		},
	}
}

// Keep the old task for backward compatibility
export const BuildUiTask = {
	run: async (options: any): Promise<BuildUiResult> => {
		const currentFiles = await getUserFiles(options)
		const outputPath = join(options.output, 'ui.html')

		await viteState.viteUi.close()

		const timer = new Timer()

		if (!currentFiles.manifest.ui) {
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
			runWatchMode(configOptions)
		} else {
			timer.start()
			await runBuild(configOptions)
			timer.stop()
		}

		await notifyInvalidManifestOptions(options, currentFiles, 'plugin-built')

		const duration = timer.getDuration()
		return { outputPath, duration }
	},
}
