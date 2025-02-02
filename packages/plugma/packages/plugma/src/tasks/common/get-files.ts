import { GetFilesError } from '../../errors';
import type { CommandOptions, TaskContext } from '../../types';
import { createConfigs } from '../../utils/config';
import { getUserFiles } from '../../utils/files';

/**
 * Task that loads and validates plugin files, then creates necessary configurations.
 */
export const GetFilesTask = {
  name: 'common:get-files',
  async run(options: CommandOptions, context: TaskContext) {
    try {
      // Load user files
      const files = await getUserFiles();

      // Create configurations
      const configs = await createConfigs(files, options);

      // Update context with files and configs
      context.files = files;
      context.configs = configs;
    } catch (err) {
      if (err.message.includes('Failed to create configs')) {
        throw new GetFilesError('Failed to create configs', 'CONFIG_ERROR');
      }
      throw new GetFilesError(
        `Failed to load files: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'FILE_ERROR',
      );
    }
  },
};
