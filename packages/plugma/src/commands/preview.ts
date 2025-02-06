/**
 * Preview command implementation
 * Handles preview server for testing plugin builds
 */

import type { PluginOptions } from '#core/types.js';
import {
  BuildMainTask,
  BuildManifestTask,
  GetFilesTask,
  ShowPlugmaPromptTask,
  StartViteServerTask,
  StartWebSocketsServerTask,
  WrapPluginUiTask,
} from '#tasks';
import { getRandomPort } from '#utils';
import { Logger } from '#utils/log/logger.js';
import { nanoid } from 'nanoid';
import { serial } from '../tasks/runner.js';
import type { PreviewCommandOptions } from './types.js';

/**
 * Main preview command implementation
 * Sets up a preview environment for testing built plugins
 *
 * @param options - Preview configuration options
 * @remarks
 * The preview command is similar to dev but optimized for testing:
 * - Uses production-like builds
 * - Includes development server
 * - Supports WebSocket communication
 * - Enables testing plugin functionality
 */
export async function preview(options: PreviewCommandOptions): Promise<void> {
  const log = new Logger({ debug: options.debug });

  try {
    log.info('Starting preview server...');

    const pluginOptions: PluginOptions = {
      ...options,
      mode: options.mode || 'preview',
      instanceId: nanoid(),
      port: options.port || getRandomPort(),
      output: options.output || 'dist',
      command: 'preview' as const,
      cwd: options.cwd || process.cwd(),
      websockets: options.websockets ?? true,
    };

    // Execute tasks in sequence
    log.info('Executing tasks...');
    await serial(
      GetFilesTask,
      ShowPlugmaPromptTask,
      BuildManifestTask,
      WrapPluginUiTask,
      BuildMainTask,
      StartWebSocketsServerTask,
      StartViteServerTask,
    )(pluginOptions);

    log.success('Preview server started successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('Failed to start preview server:', errorMessage);
    throw error;
  }
}
