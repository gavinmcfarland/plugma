import type { FSWatcher } from 'chokidar'
import chokidar from 'chokidar'
import { relative, resolve, dirname } from 'node:path'
import { BuildCommandOptions, DevCommandOptions, PreviewCommandOptions } from '../../utils/create-options.js'
import { createBuildMainTask } from '../build-main.js'
import { createStartViteServerTask } from '../start-dev-server.js'
import { Listr } from 'listr2'
import { notifyInvalidManifestOptions } from '../../utils/config/notify-invalid-manifest-options.js'
import { buildManifestFile } from './manifest-builder.js'
import type { WatcherState } from './manifest-watcher.js'
import { viteState } from '../../utils/vite-state-manager.js'

export function setupSourceWatcher(
	options: DevCommandOptions | BuildCommandOptions | PreviewCommandOptions,
	state: WatcherState,
): FSWatcher {
	const cwd = options.cwd || process.cwd()

	// Get the manifest to determine which directories to watch
	const getPathsToWatch = async () => {
		const { files } = await buildManifestFile(options)
		const pathsToWatch: string[] = []

		// Add directory for main file if it exists
		if (files.manifest.main) {
			const mainDir = dirname(resolve(cwd, files.manifest.main))
			pathsToWatch.push(mainDir)
		}

		// Add directory for ui file if it exists
		if (files.manifest.ui) {
			const uiDir = dirname(resolve(cwd, files.manifest.ui))
			pathsToWatch.push(uiDir)
		}

		// Remove duplicates and ensure paths exist
		const uniquePathsToWatch = [...new Set(pathsToWatch)]
		return uniquePathsToWatch
	}

	const watcher = chokidar.watch([], {
		persistent: true,
		ignoreInitial: false,
	})

	// Initialize watcher with paths from manifest
	const initializeWatcher = async () => {
		const pathsToWatch = await getPathsToWatch()
		// console.log('Setting up source watcher for paths:', pathsToWatch)

		// Clear existing watchers and add new ones
		await watcher.close()
		pathsToWatch.forEach((path) => watcher.add(path))
	}

	// Initialize on startup
	initializeWatcher()

	watcher.on('add', async (filePath) => {
		const { files } = await buildManifestFile(options)
		if (state.existingFiles.has(filePath)) return
		state.existingFiles.add(filePath)

		const relativePath = relative(cwd, filePath)
		const { result } = await buildManifestFile(options)

		// Only start Vite server if UI file changed and no server is running
		if (relativePath === result.raw.ui && options.command !== 'build') {
			// Check if server is already running
			if (!viteState.viteServer) {
				const startViteTask = createStartViteServerTask(options)
				const listr = new Listr([startViteTask], { concurrent: false })
				await listr.run({})
			}
		}

		// Rebuild main if main file changed
		if (relativePath === result.raw.main) {
			const buildMainTask = createBuildMainTask(options)
			const listr = new Listr([buildMainTask], { concurrent: false })
			await listr.run({})
		}

		notifyInvalidManifestOptions(options, files, 'file-added')
	})

	// Re-initialize watcher when manifest changes
	watcher.on('change', async (filePath) => {
		// Check if this is a manifest file change
		const relativePath = relative(cwd, filePath)
		if (relativePath.includes('manifest.') || relativePath === 'package.json') {
			await initializeWatcher()
		}
	})

	return watcher
}
