import { TaskRunner } from '../core/task-runner/task-runner';
import { BuildMainTask } from '../tasks/build/main';
import { BuildManifestTask } from '../tasks/build/manifest';
import { BuildUiTask } from '../tasks/build/ui';
import { GetFilesTask } from '../tasks/common/get-files';
import { ShowPlugmaPromptTask } from '../tasks/common/show-plugma-prompt';
import type { CommandOptions } from '../types';

/**
 * Executes the build command to create a production build of the plugin.
 * Tasks are executed in the following order:
 * 1. Get Files - Load and validate plugin files
 * 2. Show Prompt - Display build start message
 * 3. Build Main - Build the main plugin script
 * 4. Build UI - Build the UI components
 * 5. Build Manifest - Generate the plugin manifest
 *
 * @param options - Command options including debug mode and command name
 */
export async function build(options: CommandOptions) {
  try {
    // Execute tasks in sequence
    await TaskRunner.serial(
      GetFilesTask,
      ShowPlugmaPromptTask,
      BuildMainTask,
      BuildUiTask,
      BuildManifestTask,
    );
  } catch (error) {
    throw new Error(`Failed to build plugin: ${error.message}`);
  }
}
