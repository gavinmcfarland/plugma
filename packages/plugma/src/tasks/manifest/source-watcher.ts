import type { FSWatcher } from 'chokidar'
import chokidar from 'chokidar'
import { relative, resolve } from 'node:path'
import { BuildCommandOptions, DevCommandOptions, PreviewCommandOptions } from '../../utils/create-options.js'
import { createBuildMainTask } from '../build-main.js'
import { BuildUiTask } from '../build-ui.js'
import { createStartViteServerTask } from '../start-dev-server.js'
import { Listr } from 'listr2'
import { notifyInvalidManifestOptions } from '../../utils/config/notify-invalid-manifest-options.js'
import { buildManifestFile } from './manifest-builder.js'
import type { WatcherState } from './manifest-watcher.js'

export function setupSourceWatcher(
	options: DevCommandOptions | BuildCommandOptions | PreviewCommandOptions,
	state: WatcherState,
): FSWatcher {
	const srcPath = resolve('./src')

	const watcher = chokidar.watch([srcPath], {
		persistent: true,
		ignoreInitial: false,
	})

	watcher.on('add', async (filePath) => {
		const { files } = await buildManifestFile(options)
		if (state.existingFiles.has(filePath)) return
		state.existingFiles.add(filePath)

		const relativePath = relative(process.cwd(), filePath)
		const { result } = await buildManifestFile(options)

		if (relativePath === result.raw.ui && options.command !== 'build') {
			const startViteTask = createStartViteServerTask(options)
			const listr = new Listr([startViteTask], { concurrent: false })
			await listr.run({})
		}
		if (relativePath === result.raw.main) {
			const buildMainTask = createBuildMainTask(options)
			const listr = new Listr([buildMainTask], { concurrent: false })
			await listr.run({})
		}

		notifyInvalidManifestOptions(options, files, 'file-added')
	})

	return watcher
}
