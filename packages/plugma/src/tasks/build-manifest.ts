import type { GetTaskTypeFor, ManifestFile, PluginOptions, ResultsOfTask } from '../core/types.js'
import { GetFilesTask } from '../tasks/get-files.js'
import RestartViteServerTask from '../tasks/start-dev-server.js'
import { registerCleanup } from '../utils/cleanup.js'
import { notifyInvalidManifestOptions } from '../utils/config/notify-invalid-manifest-options.js'
import { filterNullProps } from '../utils/filter-null-props.js'
import { getFilesRecursively } from '../utils/fs/get-files-recursively.js'
import { Logger, defaultLogger as log } from '../utils/log/logger.js'
import { getUserFiles } from '../utils/config/get-user-files.js'
import { BuildMainTask } from './build-main.js'
import { BuildUiTask } from './build-ui.js'
import chokidar, { FSWatcher } from 'chokidar'
import { access, mkdir, writeFile, unlink } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { task } from './runner.js'

// Interfaces and Types
export interface BuildManifestResult {
	raw: ManifestFile
	processed: ManifestFile
}

interface WatcherState {
	previousMainValue: string | undefined
	previousUiValue: string | undefined
	existingFiles: Set<string>
}

// Constants
const DEFAULT_MANIFEST_VALUES = {
	api: '1.0.0',
}

/**
 * Sets up file watchers for development mode
 */
async function setupWatchers(
	options: PluginOptions,
	context: ResultsOfTask<GetFilesTask>,
	files: Awaited<ReturnType<typeof getUserFiles>>,
	initialManifest: ManifestFile,
	logger: Logger,
): Promise<void> {
	const state: WatcherState = {
		previousMainValue: initialManifest.main,
		previousUiValue: initialManifest.ui,
		existingFiles: new Set(await getFilesRecursively(resolve('./src'))),
	}

	const manifestWatcher = setupManifestWatcher(options, context, files, state, logger)
	const srcWatcher = setupSourceWatcher(options, context, files, state, logger)

	registerCleanup(async () => {
		await Promise.all([manifestWatcher.close(), srcWatcher.close()])
	})
}

/**
 * Sets up watcher for manifest.json and package.json
 */
function setupManifestWatcher(
	options: PluginOptions,
	context: ResultsOfTask<GetFilesTask>,
	files: Awaited<ReturnType<typeof getUserFiles>>,
	state: WatcherState,
	logger: Logger,
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
			const { files, result } = await buildManifestFile(options, logger)
			notifyInvalidManifestOptions(options, files, 'manifest-changed')

			const outputMainPath = join(outputDirPath, 'main.js')
			const outputUiPath = join(outputDirPath, 'ui.html')

			// Handle main.js file
			if (result.raw.main !== state.previousMainValue) {
				if (result.raw.main) {
					await BuildMainTask.run(options, context)
				} else {
					// Remove main.js if it was removed from manifest
					try {
						await unlink(outputMainPath)
						logger.debug('Removed main.js as it was removed from manifest')
					} catch (error) {
						// Ignore if file doesn't exist
					}
				}
				state.previousMainValue = result.raw.main
			} else if (result.raw.main && !(await fileExists(outputMainPath))) {
				await BuildMainTask.run(options, context)
			}

			// Handle ui.html file
			if (result.raw.ui !== state.previousUiValue) {
				if (result.raw.ui) {
					if (options.command !== 'build') {
						await RestartViteServerTask.run(options, context)
					}
					await BuildUiTask.run(options, context)
				} else {
					// Remove ui.html if it was removed from manifest
					try {
						await unlink(outputUiPath)
						logger.debug('Removed ui.html as it was removed from manifest')
					} catch (error) {
						// Ignore if file doesn't exist
					}
				}
				state.previousUiValue = result.raw.ui
			} else if (result.raw.ui && !(await fileExists(outputUiPath))) {
				if (options.command !== 'build') {
					await RestartViteServerTask.run(options, context)
				}
				await BuildUiTask.run(options, context)
			}
		} catch (error) {
			logger.debug('Error processing manifest change:', error)
		}
	})

	return watcher
}

/**
 * Sets up watcher for the src directory
 */
function setupSourceWatcher(
	options: PluginOptions,
	context: ResultsOfTask<GetFilesTask>,
	files: Awaited<ReturnType<typeof getUserFiles>>,
	state: WatcherState,
	logger: Logger,
): FSWatcher {
	const srcPath = resolve('./src')

	const watcher = chokidar.watch([srcPath], {
		persistent: true,
		ignoreInitial: false,
	})

	watcher.on('add', async (filePath) => {
		if (state.existingFiles.has(filePath)) return
		state.existingFiles.add(filePath)

		const relativePath = relative(process.cwd(), filePath)
		const { result } = await buildManifestFile(options, logger)

		if (relativePath === result.raw.ui && options.command !== 'build') {
			await RestartViteServerTask.run(options, context)
		}
		if (relativePath === result.raw.main) {
			await BuildMainTask.run(options, context)
		}

		notifyInvalidManifestOptions(options, files, 'file-added')
	})

	return watcher
}

// Add helper function to check if file exists
async function fileExists(filePath: string): Promise<boolean> {
	try {
		await access(filePath)
		return true
	} catch {
		return false
	}
}

/**
 * Builds and writes the manifest file to disk
 */
async function buildManifestFile(
	options: PluginOptions,
	logger: Logger,
): Promise<{
	files: Awaited<ReturnType<typeof getUserFiles>>
	result: BuildManifestResult
}> {
	const outputDirPath = resolve(options.cwd || process.cwd(), options.output)
	const manifestPath = join(outputDirPath, 'manifest.json')
	const files = await getUserFiles(options)

	const overriddenValues: Partial<ManifestFile> = {}

	// Handle main.js file
	if (files.manifest.main) {
		logger.debug('Setting main path to main.js')
		overriddenValues.main = 'main.js'
	} else {
		// Remove main.js if not specified
		const mainPath = join(outputDirPath, 'main.js')
		try {
			await unlink(mainPath)
			logger.debug('Removed main.js as it was not specified in manifest')
		} catch (error) {
			// Ignore if file doesn't exist
		}
	}

	// Handle ui.html file
	if (files.manifest.ui) {
		logger.debug('Setting ui path to ui.html')
		overriddenValues.ui = 'ui.html'
	} else {
		// Remove ui.html if not specified
		const uiPath = join(outputDirPath, 'ui.html')
		try {
			await unlink(uiPath)
			logger.debug('Removed ui.html as it was not specified in manifest')
		} catch (error) {
			// Ignore if file doesn't exist
		}
	}

	const processed = filterNullProps({
		...DEFAULT_MANIFEST_VALUES,
		...files.manifest,
		...overriddenValues,
	})

	await writeFile(manifestPath, JSON.stringify(processed, null, 2), 'utf-8')
	await verifyManifestFile(manifestPath, logger)

	return {
		files,
		result: {
			raw: files.manifest,
			processed,
		},
	}
}

/**
 * Verifies the manifest file was created correctly when in debug mode
 */
async function verifyManifestFile(manifestPath: string, logger: Logger): Promise<void> {
	if (process.env.PLUGMA_DEBUG_TASK !== 'build:manifest') return

	try {
		const manifestExists = await access(manifestPath)
			.then(() => true)
			.catch(() => false)

		if (manifestExists) {
			logger.debug('✓ Verified manifest.json exists at:', manifestPath)
		} else {
			logger.debug('✗ manifest.json was not created at:', manifestPath)
		}
	} catch (err) {
		logger.debug('Error checking manifest file:', err)
	}
}

/**
 * Main task function that generates and maintains the plugin manifest file.
 * Important: This task ensures the dist directory exists and maintains the files in it. You should not clean the dist dir in one go because it will cause issues when the plugin window is open in figma.
 */
export const BuildManifestTask = task(
	'build:manifest',
	async (options: PluginOptions, context: ResultsOfTask<GetFilesTask>): Promise<BuildManifestResult> => {
		const logger = new Logger({
			debug: options.debug,
			prefix: 'build:manifest',
		})

		try {
			// Create output directory before building manifest
			const outputDirPath = resolve(options.cwd || process.cwd(), options.output)
			await mkdir(outputDirPath, { recursive: true })

			const { files, result } = await buildManifestFile(options, logger)

			const isWatchMode =
				options.command === 'dev' ||
				options.command === 'preview' ||
				(options.command === 'build' && options.watch)

			if (isWatchMode) {
				await setupWatchers(options, context, files, result.raw, logger)
			} else if (options.command === 'build') {
				registerCleanup(async () => {
					logger.debug('Skipping manifest cleanup in build mode')
				})
			}

			return result
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			throw new Error(`Failed to build manifest: ${errorMessage}`)
		}
	},
)
