/**
 * Vite server task implementation
 */

import type {
  GetTaskTypeFor,
  PluginOptions,
  ResultsOfTask,
} from '#core/types.js';
import { registerCleanup } from '#utils/cleanup.js';
import { Logger } from '#utils/log/logger.js';
import type { ViteDevServer } from 'vite';
import { createServer } from 'vite';
import { GetFilesTask } from '../common/get-files.js';
import { task } from '../runner.js';

/**
 * Result type for the start-vite-server task
 */
export interface StartViteServerResult {
  /** The Vite dev server instance */
  server: ViteDevServer;
  /** The port the server is running on */
  port: number;
}

/**
 * Shared Vite server state to manage server instances
 */
export const viteState = {
  /** Main Vite development server */
  viteServer: null as ViteDevServer | null,
  /** Build-specific Vite server */
  viteBuild: null as ViteDevServer | null,
  /** UI-specific Vite server */
  viteUi: null as ViteDevServer | null,
};

/**
 * Task that starts and manages the Vite development server.
 *
 * This task is responsible for:
 * 1. Server Lifecycle:
 *    - Starting the Vite dev server
 *    - Managing server state
 *    - Handling cleanup on exit
 * 2. Configuration:
 *    - Setting up HMR and middleware
 *    - Configuring source maps
 *    - Managing dependencies
 * 3. Development Features:
 *    - Hot Module Replacement
 *    - Source map handling
 *    - Port management
 *
 * The server is only started when:
 * - Running in dev/preview mode
 * - UI is specified in manifest
 * - Required files exist
 *
 * @param options - Plugin build options including command, output path, etc
 * @param context - Task context containing results from previous tasks
 * @returns Object containing server instance and port
 */
const startViteServer = async (
  options: PluginOptions,
  context: ResultsOfTask<GetFilesTask>,
): Promise<StartViteServerResult> => {
  try {
    const log = new Logger({ debug: options.debug });

    // Get files from previous task
    const fileResult = context[GetFilesTask.name];
    if (!fileResult) {
      throw new Error('get-files task must run first');
    }

    const { files, config } = fileResult;

    // Skip if no UI is specified
    if (!files.manifest.ui) {
      log.debug('No UI specified in manifest, skipping Vite server');
      throw new Error('UI must be specified in manifest to start Vite server');
    }

    // Close existing server if any
    if (viteState.viteServer) {
      log.debug('Closing existing Vite server...');
      await viteState.viteServer.close();
      viteState.viteServer = null;
    }

    // Register cleanup handler
    const cleanup = async () => {
      log.debug('Cleaning up Vite server...');
      if (viteState.viteServer) {
        try {
          await viteState.viteServer.close();
          viteState.viteServer = null;
          log.success('Vite server closed');
        } catch (error) {
          log.error('Failed to close Vite server:', error);
        }
      }
    };
    registerCleanup(cleanup);

    log.debug('Starting Vite server...');

    // Configure Vite server
    const server = await createServer({
      ...config.ui.dev, // Use UI dev config from get-files
      root: process.cwd(),
      base: '/',
      server: {
        port: options.port,
        strictPort: true,
        cors: true,
        host: 'localhost',
        middlewareMode: false,
        sourcemapIgnoreList: () => true,
        hmr: {
          port: options.port,
          protocol: 'ws',
          host: 'localhost',
        },
      },
      optimizeDeps: {
        entries: [files.manifest.ui || '', files.manifest.main || ''].filter(
          Boolean,
        ),
      },
      logLevel: options.debug ? 'info' : 'error',
    }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create Vite server: ${message}`);
    });

    // Start the server
    try {
      await server.listen();
      const resolvedPort = server.config.server.port || options.port;
      log.success(`Vite server running at http://localhost:${resolvedPort}`);

      // Store server instance
      viteState.viteServer = server;

      return {
        server,
        port: resolvedPort,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to start Vite server: ${message}`);
    }
  } catch (error) {
    // Re-throw with context if not already a server error
    if (error instanceof Error && !error.message.includes('Vite server')) {
      throw new Error(`Vite server task failed: ${error.message}`);
    }
    throw error;
  }
};

export const StartViteServerTask = task('server:start-vite', startViteServer);
export type StartViteServerTask = GetTaskTypeFor<typeof StartViteServerTask>;

export default StartViteServerTask;
