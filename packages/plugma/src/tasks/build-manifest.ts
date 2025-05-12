import type { ManifestFile } from '../core/types.js'
import { registerCleanup } from '../utils/cleanup.js'
import { getFilesRecursively } from '../utils/fs/get-files-recursively.js'
import { resolve } from 'node:path'
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
