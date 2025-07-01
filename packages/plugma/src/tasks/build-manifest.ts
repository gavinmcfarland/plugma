import type { ManifestFile } from '../core/types.js'
import { registerCleanup } from '../utils/cleanup.js'
import { getFilesRecursively } from '../utils/fs/get-files-recursively.js'
import { resolve, dirname } from 'node:path'
import { ListrTask } from 'listr2'
import { BuildCommandOptions, DevCommandOptions, PreviewCommandOptions } from '../utils/create-options.js'
import { createDebugAwareLogger } from '../utils/debug-aware-logger.js'
import { buildManifestFile } from './manifest/manifest-builder.js'
import { setupManifestWatcher } from './manifest/manifest-watcher.js'
import { setupSourceWatcher } from './manifest/source-watcher.js'
import { mkdir } from 'node:fs/promises'

export interface BuildManifestResult {
	raw: ManifestFile
	processed: ManifestFile
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
			const manifestResult = await buildManifestFile(options)
			const outputDirPath = resolve(options.cwd || process.cwd(), options.output)
			const cwd = options.cwd || process.cwd()

			// Get existing files from manifest paths
			const getExistingFiles = async () => {
				const existingFiles = new Set<string>()

				// Add files from main directory if it exists
				if (manifestResult.result.raw.main) {
					const mainDir = dirname(resolve(cwd, manifestResult.result.raw.main))
					try {
						const mainFiles = await getFilesRecursively(mainDir)
						mainFiles.forEach((file) => existingFiles.add(file))
					} catch (error) {
						// Directory might not exist yet, which is fine
					}
				}

				// Add files from ui directory if it exists
				if (manifestResult.result.raw.ui) {
					const uiDir = dirname(resolve(cwd, manifestResult.result.raw.ui))
					try {
						const uiFiles = await getFilesRecursively(uiDir)
						uiFiles.forEach((file) => existingFiles.add(file))
					} catch (error) {
						// Directory might not exist yet, which is fine
					}
				}

				return existingFiles
			}

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
							return subtask.newListr(
								[
									{
										title: 'Setting up manifest watcher',
										task: async () => {
											const existingFiles = await getExistingFiles()
											const manifestWatcher = setupManifestWatcher(options, {
												previousMainValue: manifestResult.result.raw.main,
												previousUiValue: manifestResult.result.raw.ui,
												existingFiles,
											})
											registerCleanup(async () => await manifestWatcher.close())
										},
									},
									{
										title: 'Setting up source watcher',
										task: async () => {
											const existingFiles = await getExistingFiles()
											const srcWatcher = setupSourceWatcher(options, {
												previousMainValue: manifestResult.result.raw.main,
												previousUiValue: manifestResult.result.raw.ui,
												existingFiles,
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
