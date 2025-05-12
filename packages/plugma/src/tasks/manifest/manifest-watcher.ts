import type { FSWatcher } from 'chokidar'
import chokidar from 'chokidar'
import { join, resolve } from 'node:path'
import { unlink } from 'node:fs/promises'
import { BuildCommandOptions, DevCommandOptions, PreviewCommandOptions } from '../../utils/create-options.js'
import { createBuildMainTask } from '../build-main.js'
import { BuildUiTask } from '../build-ui.js'
import { createStartViteServerTask } from '../start-dev-server.js'
import { Listr } from 'listr2'
import { fileExists } from './utils.js'
import { notifyInvalidManifestOptions } from '../../utils/config/notify-invalid-manifest-options.js'
import { buildManifestFile } from './manifest-builder.js'

export interface WatcherState {
	previousMainValue: string | undefined
	previousUiValue: string | undefined
	existingFiles: Set<string>
}

export function setupManifestWatcher(
	options: DevCommandOptions | BuildCommandOptions | PreviewCommandOptions,
	state: WatcherState,
): FSWatcher {
	const manifestPath = resolve('./manifest.json')
	const userPkgPath = resolve('./package.json')
	const outputDirPath = resolve(options.cwd || process.cwd(), options.output)

	const watcher = chokidar.watch([manifestPath, userPkgPath], {
		persistent: true,
		ignoreInitial: false,
		awaitWriteFinish: {
			stabilityThreshold: 100,
			pollInterval: 100,
		},
	})

	watcher.on('change', async () => {
		try {
			const { files, result } = await buildManifestFile(options)
			notifyInvalidManifestOptions(options, files, 'manifest-changed')

			const outputMainPath = join(outputDirPath, 'main.js')
			const outputUiPath = join(outputDirPath, 'ui.html')

			await handleMainFileChanges(options, result, state, outputMainPath)
			await handleUiFileChanges(options, result, state, outputUiPath)
		} catch (error) {
			// Error handling is done in the manifest builder
		}
	})

	return watcher
}

async function handleMainFileChanges(
	options: DevCommandOptions | BuildCommandOptions | PreviewCommandOptions,
	result: { raw: { main?: string } },
	state: WatcherState,
	outputMainPath: string,
) {
	if (result.raw.main !== state.previousMainValue) {
		if (result.raw.main) {
			const buildMainTask = createBuildMainTask(options)
			const listr = new Listr([buildMainTask], { concurrent: false })
			await listr.run({})
		} else {
			try {
				await unlink(outputMainPath)
			} catch (error) {
				// Ignore if file doesn't exist
			}
		}
		state.previousMainValue = result.raw.main
	} else if (result.raw.main && !(await fileExists(outputMainPath))) {
		const buildMainTask = createBuildMainTask(options)
		const listr = new Listr([buildMainTask], { concurrent: false })
		await listr.run({})
	}
}

async function handleUiFileChanges(
	options: DevCommandOptions | BuildCommandOptions | PreviewCommandOptions,
	result: { raw: { ui?: string } },
	state: WatcherState,
	outputUiPath: string,
) {
	if (result.raw.ui !== state.previousUiValue) {
		if (result.raw.ui) {
			if (options.command !== 'build') {
				const startViteTask = createStartViteServerTask(options)
				const listr = new Listr([startViteTask], { concurrent: false })
				await listr.run({})
			}
			await BuildUiTask.run(options)
		} else {
			try {
				await unlink(outputUiPath)
			} catch (error) {
				// Ignore if file doesn't exist
			}
		}
		state.previousUiValue = result.raw.ui
	} else if (result.raw.ui && !(await fileExists(outputUiPath))) {
		if (options.command !== 'build') {
			const startViteTask = createStartViteServerTask(options)
			const listr = new Listr([startViteTask], { concurrent: false })
			await listr.run({})
		}
		await BuildUiTask.run(options)
	}
}
