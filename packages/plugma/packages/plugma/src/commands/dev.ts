import { TaskRunner } from '../core/task-runner/task-runner';
import { BuildMainTask } from '../tasks/build/main';
import { BuildManifestTask } from '../tasks/build/manifest';
import { BuildUiTask } from '../tasks/build/ui';
import { GetFilesTask } from '../tasks/common/get-files';
import { ShowPlugmaPromptTask } from '../tasks/common/show-plugma-prompt';
import { RestartViteServerTask } from '../tasks/server/restart-vite';
import { StartViteServerTask } from '../tasks/server/vite';
import { StartWebSocketsServerTask } from '../tasks/server/websocket';
import type { CommandOptions } from '../types';

/**
 * Executes the dev command to start the development server.
 * Tasks are executed in the following order:
 * 1. Get Files - Load and validate plugin files
 * 2. Show Prompt - Display dev server start message
 * 3. Build UI - Build the UI components
 * 4. Build Main - Build the main plugin script
 * 5. Build Manifest - Generate the plugin manifest
 * 6. Start Vite Server - Start the development server
 * 7. Restart Vite Server - Set up server restart handler
 * 8. Start WebSocket Server - Start WebSocket server for live reload
 *
 * @param options - Command options including debug mode and command name
 */
export async function dev(options: CommandOptions) {
  try {
    // Execute tasks in sequence
    await TaskRunner.serial(
      GetFilesTask,
      ShowPlugmaPromptTask,
      BuildUiTask,
      BuildMainTask,
      BuildManifestTask,
      StartViteServerTask,
      RestartViteServerTask,
      StartWebSocketsServerTask,
    );
  } catch (error) {
    throw new Error(`Failed to start development server: ${error.message}`);
  }
}
