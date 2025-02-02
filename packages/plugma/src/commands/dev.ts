/**
 * Development command implementation
 * Handles development server and file watching for plugin development
 */

import type { DevCommandOptions } from '#commands/types.js';
import {
  BuildMainTask,
  BuildManifestTask,
  BuildUiTask,
  GetFilesTask,
  RestartViteServerTask,
  ShowPlugmaPromptTask,
  StartViteServerTask,
  StartWebSocketsServerTask,
} from '#tasks';
import { serial } from '#tasks/runner.js';
import { Logger } from '#utils/log/logger.js';
import { nanoid } from 'nanoid';
import { getRandomPort } from '../utils/get-random-port.js';

/**
 * Main development command implementation
 * Starts a development server with live reload capabilities
 *
 * @param options - Development configuration options
 * @remarks
 * The dev command sets up a full development environment with:
 * - File watching and live reload
 * - Development UI with placeholder
 * - WebSocket communication
 * - Vite development server
 * - Output file validation to ensure integrity
 */
export async function dev(options: DevCommandOptions): Promise<void> {
  const log = new Logger({ debug: options.debug });

  try {
    log.info('Starting development server...');

    const pluginOptions = {
      ...options,
      mode: options.mode || 'development',
      instanceId: nanoid(),
      port: options.port || getRandomPort(),
      output: options.output || 'dist',
      command: 'dev' as const,
    };

    // Execute tasks in sequence
    log.info('Executing tasks...');
    await serial(
      GetFilesTask,
      ShowPlugmaPromptTask,
      BuildUiTask,
      BuildMainTask,
      BuildManifestTask,
      StartViteServerTask,
      RestartViteServerTask,
      StartWebSocketsServerTask,
    )(pluginOptions);

    log.success('Development server started successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('Failed to start development server:', errorMessage);
    throw error;
  }
}
