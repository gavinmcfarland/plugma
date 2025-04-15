/**
 * Vite server task implementation
 */

import type { GetTaskTypeFor, PluginOptions, ResultsOfTask } from '../core/types.js'
import { registerCleanup } from '../utils/cleanup.js'
import { Logger } from '../utils/log/logger.js'
import type { RollupWatcher } from 'rollup'
import type { ViteDevServer } from 'vite'
import { createServer, mergeConfig } from 'vite'
import { GetFilesTask } from '../tasks/get-files.js'
import { task } from '../tasks/runner.js'
import type { LogLevel } from 'vite'

import { createViteConfigs } from '../utils/config/create-vite-configs.js'
import { loadConfig } from '../utils/config/load-config.js'
import { BuildWatcherWrapper } from './build-ui.js'
import { viteState } from '../utils/vite-state-manager.js'
import { getUserFiles } from '../utils/config/index.js'

/**
 * Result type for the start-vite-server task
 */
export interface StartViteServerResult {
	/** The Vite dev server instance */
	server: ViteDevServer
	/** The port the server is running on */
	port: number
}

/**
 * Task that starts and manages the Vite development server.
 *
 * This task is responsible for:
 * 1. Server Lifecycle:
 *    - Starting the Vite dev server
 *    - Managing server state
 *    - Ensuring proper server shutdown
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
		const log = new Logger({ debug: options.debug })

		const files = await getUserFiles(options)
		const configs = createViteConfigs(options, files)

		// Skip if no UI is specified
		if (!files.manifest.ui) {
			log.debug('No UI specified in manifest, skipping Vite server')
			throw new Error('UI must be specified in manifest to start Vite server')
		}

		// Close existing server if any
		if (viteState.viteServer) {
			log.debug('Closing existing Vite server...')
			await viteState.viteServer.close()
			viteState.viteServer = null
		}

		// Register cleanup handler
		registerCleanup(async () => {
			log.debug('Cleaning up Vite server...')

			// Close the Vite server if it exists
			if (viteState.viteServer) {
				try {
					await viteState.viteServer.close()
					viteState.viteServer = null
					log.success('Vite server closed')
				} catch (error) {
					log.error('Failed to close Vite server:', error)
				}
			}

			// Close the main watcher if it exists
			if (viteState.viteMain) {
				try {
					await viteState.viteMain.close()
					log.success('Vite main watcher closed')
				} catch (error) {
					log.error('Failed to close Vite main watcher:', error)
				}
			}

			// Replace explicit null assignment with close()
			try {
				await viteState.viteUi.close()
				log.success('Vite UI server closed')
			} catch (error) {
				log.error('Failed to close Vite UI server:', error)
			}

			// Reset state
			viteState.isBuilding = false
			viteState.messageQueue = []
		})

		log.debug('Starting Vite server...')

		// Base config for the Vite server
		const baseConfig = {
			...configs.ui.dev,
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
				fs: {
					// Disable Vite's caching for certain files
					strict: false,
					allow: ['.'],
				},
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
					'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Range',
					'Access-Control-Expose-Headers': 'Content-Range',
				},
			},
			optimizeDeps: {
				entries: [files.manifest.ui || '', files.manifest.main || ''].filter(Boolean),
				// Force Vite to rebuild dependencies
				force: true,
			},
			// Clear module cache on file changes
			clearScreen: false,
			logLevel: (options.debug ? 'info' : 'error') as LogLevel,
		}

		const userUIConfig = await loadConfig('vite.config.ui', options)

		// Configure Vite server with caching workarounds
		const server = await createServer(
			mergeConfig(
				{
					configFile: false,
					...baseConfig,
				},
				userUIConfig?.config ?? {},
			),
		).catch((error) => {
			const message = error instanceof Error ? error.message : String(error)
			throw new Error(`Failed to create Vite server: ${message}`)
		})

		// Start the server
		try {
			const resolvedPort = server.config.server.port || options.port
			await server.listen()

			// Setup file watchers with caching workarounds
			server.watcher.on('change', async (file) => {
				if (viteState.isBuilding) {
					log.debug('Build in progress, queueing file change:', file)
					return
				}
				viteState.isBuilding = true
				try {
					// Clear module cache
					server.moduleGraph.invalidateAll()
					// Force HMR update
					server.ws.send({ type: 'full-reload' })
				} finally {
					viteState.isBuilding = false
					// Process queued messages
					for (const { message, senderId } of viteState.messageQueue) {
						server.ws.send(message, { senderId })
					}
					viteState.messageQueue = []
				}
			})

			log.success(`Vite server running at http://localhost:${resolvedPort}`)

			// Store server instance
			viteState.viteServer = server

			return {
				server,
				port: resolvedPort,
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			throw new Error(`Failed to start Vite server: ${message}`)
		}
	} catch (error) {
		// Re-throw with context if not already a server error
		if (error instanceof Error && !error.message.includes('Vite server')) {
			throw new Error(`Vite server task failed: ${error.message}`)
		}
		throw error
	}
}

export const StartViteServerTask = task('server:start-vite', startViteServer)
export type StartViteServerTask = GetTaskTypeFor<typeof StartViteServerTask>

export default StartViteServerTask
