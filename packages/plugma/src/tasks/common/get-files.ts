/**
 * File loading task implementation
 */

import type { GetTaskTypeFor, PluginOptions, UserFiles } from '#core/types.js';
import { createViteConfigs } from '#utils/config/create-vite-configs.js';
import { getUserFiles } from '#utils/config/get-user-files.js';
import { getDirName } from '#utils/path.js';
import { task } from '../runner.js';

const __dirname = getDirName(import.meta.url);

/**
 * Custom error class for file loading operations
 */
export class GetFilesError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_PACKAGE_JSON' | 'CONFIG_ERROR' | 'FILE_ERROR',
  ) {
    super(message);
    this.name = 'GetFilesError';
  }
}

/**
 * Result type for the getFiles task
 */
export interface GetFilesTaskResult {
  /** The version of the plugin */
  version: string;
  /** The files to be used by the plugin */
  files: UserFiles;
  /** The configuration objects */
  config: ReturnType<typeof createViteConfigs>;
}

/**
 * Task that loads and prepares necessary files and configurations
 */
export const getFiles = async (
  options: PluginOptions,
): Promise<GetFilesTaskResult> => {
  try {
    // Get user files
    const files = await getUserFiles(options);

    // Create configs
    const config = createViteConfigs(options, files);

    return {
      version: files.userPkgJson.version,
      files,
      config,
    };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('manifest configuration')) {
        throw new GetFilesError(
          'Invalid package.json structure',
          'INVALID_PACKAGE_JSON',
        );
      }
      if (err.message.includes('create configs')) {
        throw new GetFilesError(err.message, 'CONFIG_ERROR');
      }
    }
    throw new GetFilesError(
      `Failed to load files: ${err instanceof Error ? err.message : 'Unknown error'}`,
      'FILE_ERROR',
    );
  }
};

export const GetFilesTask = task('common:get-files', getFiles);
export type GetFilesTask = GetTaskTypeFor<typeof GetFilesTask>;

export default GetFilesTask;
