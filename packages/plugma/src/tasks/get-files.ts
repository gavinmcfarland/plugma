import type { PluginOptions, PlugmaPackageJson, UserFiles } from '../core/types.js';
import { createViteConfigs } from '../utils/config/create-vite-configs.js';
import { getUserFiles } from '@plugma/shared';
import { readJson } from '@plugma/shared';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

async function readPlugmaPackageJson(): Promise<PlugmaPackageJson> {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);
	return readJson<PlugmaPackageJson>(join(__dirname, '..', '..', 'package.json'));
}
import { Logger } from '../utils/log/logger.js';
// import { task } from './runner.js' // Temporarily disabled - old task runner pattern
import { ListrLogger, ListrLogLevels, ListrLoggerOptions } from 'listr2';
import { LISTR_LOGGER_STYLES } from '../constants.js';
import { DebugAwareLogger, createDebugAwareLogger } from '../utils/debug-aware-logger.js';

/**
 * Custom error class for file loading operations
 */
export class GetFilesError extends Error {
	constructor(
		message: string,
		public code: 'INVALID_PACKAGE_JSON' | 'CONFIG_ERROR' | 'FILE_ERROR',
		public cause?: Error | unknown,
	) {
		super(`${message}: ${cause instanceof Error ? cause.message : String(cause)}`);
		this.name = 'GetFilesError';
		this.stack = cause instanceof Error ? cause.stack : undefined;
	}
}

/**
 * Result type for the getFiles task
 */
export interface GetFilesTaskResult {
	/** The version of the plugin */
	plugmaPkg: PlugmaPackageJson;
	/** The files to be used by the plugin */
	files: UserFiles;
	/** The configuration objects */
	config: ReturnType<typeof createViteConfigs>;
}

/**
 * Task that loads and prepares necessary files and configurations
 */
export const getFiles = async (options: PluginOptions): Promise<GetFilesTaskResult> => {
	const logger = createDebugAwareLogger(options.debug);
	let plugmaPkg: PlugmaPackageJson;
	let files: UserFiles;
	let config: ReturnType<typeof createViteConfigs>;

	try {
		logger.log(ListrLogLevels.OUTPUT, 'Starting get-files task...');

		try {
			logger.log(ListrLogLevels.OUTPUT, 'Getting user files...');
			files = await getUserFiles(options);
			logger.log(ListrLogLevels.OUTPUT, [
				'User files loaded:',
				{
					manifest: files.manifest,
					userPkgJson: files.userPkgJson,
				},
			]);
		} catch (err) {
			if (err instanceof Error && err.message.includes('manifest configuration')) {
				throw new GetFilesError('Invalid package.json structure', 'INVALID_PACKAGE_JSON');
			}
			throw new GetFilesError('Failed to load files', 'FILE_ERROR', err);
		}

		try {
			logger.log(ListrLogLevels.OUTPUT, 'Creating Vite configs...');
			config = createViteConfigs(options, files);
			logger.log(ListrLogLevels.OUTPUT, 'Vite configs created successfully');
		} catch (err) {
			throw new GetFilesError('Failed to create configs', 'CONFIG_ERROR', err);
		}

		logger.log(ListrLogLevels.OUTPUT, 'Reading Plugma package.json...');
		plugmaPkg = await readPlugmaPackageJson();
		logger.log(ListrLogLevels.OUTPUT, 'Plugma package.json loaded successfully');

		logger.log(ListrLogLevels.OUTPUT, 'Get-files task completed successfully');
		return {
			plugmaPkg,
			files,
			config,
		};
	} catch (err) {
		if (err instanceof GetFilesError) {
			throw err;
		}
		throw new GetFilesError('Failed to load files', 'FILE_ERROR', err);
	}
};

// Temporary exports for compatibility with old tests
export const GetFilesTask = {
	name: 'common:get-files',
	run: getFiles,
};
export type GetFilesTask = typeof GetFilesTask;

export default GetFilesTask;
