import PlugmaPackageJson from '#packageJson' with { type: 'json' };
import type { PackageJson } from 'type-fest';

import type { GetTaskTypeFor, PluginOptions, UserFiles } from '#core/types.js';
import { createViteConfigs } from '#utils/config/create-vite-configs.js';
import { getUserFiles } from '#utils/config/get-user-files.js';
import { task } from '../runner.js';

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
  plugmaPkg: PackageJson;
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
  let plugmaPkg: PackageJson;
  let files: UserFiles;
  let config: ReturnType<typeof createViteConfigs>;

  try {
    try {
      // Get user files
      files = await getUserFiles(options);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes('manifest configuration')
      ) {
        throw new GetFilesError(
          'Invalid package.json structure',
          'INVALID_PACKAGE_JSON',
        );
      }
      throw new GetFilesError(
        `Failed to get user files: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'FILE_ERROR',
      );
    }

    try {
      // Create configs
      config = createViteConfigs(options, files);
    } catch (err) {
      throw new GetFilesError(
        `Failed to create configs: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'CONFIG_ERROR',
      );
    }

    return {
      plugmaPkg: PlugmaPackageJson as PackageJson,
      files,
      config,
    };
  } catch (err) {
    if (err instanceof GetFilesError) {
      throw err;
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
