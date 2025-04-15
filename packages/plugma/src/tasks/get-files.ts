import type { GetTaskTypeFor, PluginOptions, PlugmaPackageJson, UserFiles } from '../core/types.js'
import { createViteConfigs } from '../utils/config/create-vite-configs.js'
import { getUserFiles } from '../utils/get-user-files.js'
import { readPlugmaPackageJson } from '../utils/fs/read-json.js'
import { Logger } from '../utils/log/logger.js'
import { task } from './runner.js'

/**
 * Custom error class for file loading operations
 */
export class GetFilesError extends Error {
	constructor(
		message: string,
		public code: 'INVALID_PACKAGE_JSON' | 'CONFIG_ERROR' | 'FILE_ERROR',
		public cause?: Error | unknown,
	) {
		super(`${message}: ${cause instanceof Error ? cause.message : String(cause)}`)
		this.name = 'GetFilesError'
		this.stack = cause instanceof Error ? cause.stack : undefined
	}
}

/**
 * Result type for the getFiles task
 */
export interface GetFilesTaskResult {
	/** The version of the plugin */
	plugmaPkg: PlugmaPackageJson
	/** The files to be used by the plugin */
	files: UserFiles
	/** The configuration objects */
	config: ReturnType<typeof createViteConfigs>
}

/**
 * Task that loads and prepares necessary files and configurations
 */
export const getFiles = async (options: PluginOptions): Promise<GetFilesTaskResult> => {
	const logger = new Logger({
		debug: options.debug,
		prefix: 'common:get-files',
	})
	let plugmaPkg: PlugmaPackageJson
	let files: UserFiles
	let config: ReturnType<typeof createViteConfigs>

	try {
		logger.debug('Starting get-files task...')

		try {
			logger.debug('Getting user files...')
			files = await getUserFiles(options)
			logger.debug('User files loaded:', {
				manifest: files.manifest,
				userPkgJson: files.userPkgJson,
			})
		} catch (err) {
			if (err instanceof Error && err.message.includes('manifest configuration')) {
				throw new GetFilesError('Invalid package.json structure', 'INVALID_PACKAGE_JSON')
			}
			throw new GetFilesError('Failed to load files', 'FILE_ERROR', err)
		}

		try {
			logger.debug('Creating Vite configs...')
			config = createViteConfigs(options, files)
			logger.debug('Vite configs created successfully')
		} catch (err) {
			throw new GetFilesError('Failed to create configs', 'CONFIG_ERROR', err)
		}

		logger.debug('Reading Plugma package.json...')
		plugmaPkg = await readPlugmaPackageJson()
		logger.debug('Plugma package.json loaded successfully')

		logger.debug('Get-files task completed successfully')
		return {
			plugmaPkg,
			files,
			config,
		}
	} catch (err) {
		if (err instanceof GetFilesError) {
			throw err
		}
		throw new GetFilesError('Failed to load files', 'FILE_ERROR', err)
	}
}

export const GetFilesTask = task('common:get-files', getFiles)
export type GetFilesTask = GetTaskTypeFor<typeof GetFilesTask>

export default GetFilesTask
