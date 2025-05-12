import type { ManifestFile } from '../core/types.js'
import { createStartViteServerTask } from '../tasks/start-dev-server.js'
import { registerCleanup } from '../utils/cleanup.js'
import { notifyInvalidManifestOptions } from '../utils/config/notify-invalid-manifest-options.js'
import { filterNullProps } from '../utils/filter-null-props.js'
import { getFilesRecursively } from '../utils/fs/get-files-recursively.js'
import { getUserFiles } from '../utils/get-user-files.js'
import { createBuildMainTask } from './build-main.js'
import { BuildUiTask } from './build-ui.js'
import chokidar, { FSWatcher } from 'chokidar'
import { access, mkdir, writeFile, unlink } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { ListrTask, Listr, ListrLogLevels } from 'listr2'
import { BuildCommandOptions, DevCommandOptions, PreviewCommandOptions } from '../utils/create-options.js'
import { createDebugAwareLogger } from '../utils/debug-aware-logger.js'
import { transformManifest } from '../utils/transform-manifest.js'

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
 * Sets up watcher for manifest.json and package.json
 */
function setupManifestWatcher(
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

			// Handle main.js file
			if (result.raw.main !== state.previousMainValue) {
				if (result.raw.main) {
					const buildMainTask = createBuildMainTask(options)
					const listr = new Listr([buildMainTask], { concurrent: false })
					await listr.run({})
				} else {
					// Remove main.js if it was removed from manifest
					try {
						await unlink(outputMainPath)
						// logger.debug('Removed main.js as it was removed from manifest')
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

			// Handle ui.html file
			if (result.raw.ui !== state.previousUiValue) {
				if (result.raw.ui) {
					if (options.command !== 'build') {
						const startViteTask = createStartViteServerTask(options)
						const listr = new Listr([startViteTask], { concurrent: false })
						await listr.run({})
					}
					await BuildUiTask.run(options)
				} else {
					// Remove ui.html if it was removed from manifest
					try {
						await unlink(outputUiPath)
						// logger.debug('Removed ui.html as it was removed from manifest')
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
		} catch (error) {
			// logger.debug('Error processing manifest change:', error)
		}
	})

	return watcher
}

/**
 * Sets up watcher for the src directory
 */
function setupSourceWatcher(options: any, state: WatcherState): FSWatcher {
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

// Add helper function to check if file exists
async function fileExists(filePath: string): Promise<boolean> {
	try {
		await access(filePath)
		return true
	} catch {
		return false
	}
}

async function validateManifest(manifest?: Partial<ManifestFile>) {
	if (!manifest) {
		throw new Error('No manifest found in manifest.json or package.json')
	}

	if (!manifest.main && !manifest.ui) {
		throw new Error('No main or UI file specified')
	}

	if (!manifest.name) {
		console.warn('Plugma: Please specify the name in the manifest. Example: `{ name: "My Plugin" }`')
	}
}

/**
 * Builds and writes the manifest file to disk
 */
async function buildManifestFile(options: DevCommandOptions | BuildCommandOptions | PreviewCommandOptions): Promise<{
	files: Awaited<ReturnType<typeof getUserFiles>>
	result: BuildManifestResult
}> {
	const logger = createDebugAwareLogger(options.debug)
	const files = await getUserFiles(options)
	await validateManifest(files.manifest)
	const outputDirPath = resolve(options.cwd || process.cwd(), options.output)
	const manifestPath = join(outputDirPath, 'manifest.json')

	const overriddenValues: Partial<ManifestFile> = {}

	// Handle main.js file
	if (files.manifest.main) {
		logger.log(ListrLogLevels.OUTPUT, 'Setting main path to main.js')
		overriddenValues.main = 'main.js'
	} else {
		// Remove main.js if not specified
		const mainPath = join(outputDirPath, 'main.js')
		try {
			await unlink(mainPath)
			logger.log(ListrLogLevels.OUTPUT, 'Removed main.js as it was not specified in manifest')
		} catch (error) {
			// Ignore if file doesn't exist
		}
	}

	// Handle ui.html file
	if (files.manifest.ui) {
		logger.log(ListrLogLevels.OUTPUT, 'Setting ui path to ui.html')
		overriddenValues.ui = 'ui.html'
	} else {
		// Remove ui.html if not specified
		const uiPath = join(outputDirPath, 'ui.html')
		try {
			await unlink(uiPath)
			logger.log(ListrLogLevels.OUTPUT, 'Removed ui.html as it was not specified in manifest')
		} catch (error) {
			// Ignore if file doesn't exist
		}
	}

	// Ensure output directory exists
	await mkdir(outputDirPath, { recursive: true })

	// Get the raw manifest from the user's files
	const rawManifest = files.manifest

	// Process the manifest
	const processedManifest = {
		...DEFAULT_MANIFEST_VALUES,
		...rawManifest,
		...overriddenValues,
	}

	// Filter out null values
	const finalManifest = filterNullProps(processedManifest)

	const processedManifest2 = transformManifest(finalManifest, options)

	// Write the manifest to disk
	await writeFile(manifestPath, JSON.stringify(processedManifest2, null, 2))

	// Verify the manifest file
	await verifyManifestFile(manifestPath)

	return {
		files,
		result: {
			raw: rawManifest,
			processed: finalManifest,
		},
	}
}

/**
 * Verifies the manifest file was created correctly when in debug mode
 */
async function verifyManifestFile(manifestPath: string): Promise<void> {
	if (process.env.PLUGMA_DEBUG_TASK !== 'build:manifest') return

	try {
		const manifestExists = await access(manifestPath)
			.then(() => true)
			.catch(() => false)

		if (manifestExists) {
			// logger.debug('✓ Verified manifest.json exists at:', manifestPath)
		} else {
			// logger.debug('✗ manifest.json was not created at:', manifestPath)
		}
	} catch (err) {
		// logger.debug('Error checking manifest file:', err)
	}
}

/**
 * Creates a listr2 task for building the manifest
 */
export const createBuildManifestTask = <T extends { raw?: ManifestFile; processed?: ManifestFile }>(
	options: DevCommandOptions | BuildCommandOptions | PreviewCommandOptions,
): ListrTask<T> => {
	const logger = createDebugAwareLogger(options.debug)
	return {
		title: 'Build Manifest',
		task: async (ctx, task) => {
			const files = await getUserFiles(options)
			const outputDirPath = resolve(options.cwd || process.cwd(), options.output)

			// Create subtasks for the build process
			return task.newListr(
				[
					{
						title: 'Creating output directory',
						task: async () => {
							await mkdir(outputDirPath, { recursive: true })
						},
					},
					{
						title: 'Build manifest file',
						task: async (_, subtask) => {
							const manifestResult = await buildManifestFile(options)

							return subtask.newListr(
								[
									{
										title: 'Setting up manifest watcher',
										task: async () => {
											const manifestWatcher = setupManifestWatcher(options, {
												previousMainValue: manifestResult.result.raw.main,
												previousUiValue: manifestResult.result.raw.ui,
												existingFiles: new Set(await getFilesRecursively(resolve('./src'))),
											})
											registerCleanup(async () => await manifestWatcher.close())
										},
									},
									{
										title: 'Setting up source watcher',
										task: async () => {
											const srcWatcher = setupSourceWatcher(options, {
												previousMainValue: manifestResult.result.raw.main,
												previousUiValue: manifestResult.result.raw.ui,
												existingFiles: new Set(await getFilesRecursively(resolve('./src'))),
											})
											registerCleanup(async () => await srcWatcher.close())
										},
									},
								],
								{ concurrent: true },
							)
						},
					},
				],
				{ concurrent: false },
			)
		},
	}
}
