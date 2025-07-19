import type { GetTaskTypeFor, PluginOptions, ResultsOfTask } from '../core/types.js'
import { Logger } from '../utils/log/logger.js'
import type { InlineConfig, ViteDevServer } from 'vite'
import { createServer } from 'vite'
import { GetFilesTask } from '../tasks/get-files.js'
import { task } from '../tasks/runner.js'
import { viteState } from '../utils/vite-state-manager.js'
import { getUserFiles } from '../utils/get-user-files.js'
import { createViteConfigs } from '../utils/config/create-vite-configs.js'
import { DevCommandOptions } from '../utils/create-options.js'

/**
 * Result type for the restart-vite-server task
 */
export interface RestartViteServerResult {
	/** The restarted Vite server instance, or null if no UI is specified */
	server: ViteDevServer | null
	/** The port the server is running on, if server was started */
	port?: number
}

/**
 * Task that restarts the Vite development server.
 *
 * This task is responsible for:
 * 1. Server Lifecycle:
 *    - Closing existing server
 *    - Starting new server with updated config
 *    - Managing server state
 * 2. Configuration:
 *    - Using updated UI config
 *    - Preserving server settings
 * 3. Error Handling:
 *    - Graceful server shutdown
 *    - Proper error propagation
 *    - State cleanup on failure
 *
 * The server is only restarted when:
 * - UI is specified in manifest
 * - New configuration is available
 *
 * @param options - Plugin build options
 * @param context - Task context with results from previous tasks
 * @returns Object containing new server instance and port
 */
export const restartViteServer = async (
	options: DevCommandOptions,
	context: ResultsOfTask<GetFilesTask>,
): Promise<RestartViteServerResult> => {
	const log = new Logger({ debug: options.debug })

	try {
		const files = await getUserFiles(options)
		const config = createViteConfigs(options, files)

		// Skip if no UI is specified
		if (!files.manifest?.ui) {
			log.debug('No UI specified in manifest, skippingrestart-dev-server')
			return { server: null }
		}

		log.debug('Restarting Vite server...')

		// Close existing server if any
		if (viteState.viteServer) {
			log.debug('Closing existing Vite server...')
			try {
				await viteState.viteServer.close()
				viteState.viteServer = null
			} catch (error) {
				log.error('Failed to close existing Vite server:', error)
				// Continue with restart even if close fails
			}
		}

		// Configure and create new server
		const serverConfig: InlineConfig = {
			...config.ui.dev,
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
				entries: [files.manifest.ui || '', files.manifest.main || ''].filter(Boolean),
			},
			logLevel: options.debug ? 'info' : 'error',
		}

		// Create and start new server
		log.debug('Creating new Vite server...')
		const server = await createServer(serverConfig).catch((error) => {
			const message = error instanceof Error ? error.message : String(error)
			throw new Error(`Failed to create Vite server: ${message}`)
		})

		try {
			await server.listen()
			const resolvedPort = server.config.server.port || options.port
			log.success(`Vite server restarted on http://localhost:${resolvedPort}`)

			// Update server state
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
		// Clean up state on error
		viteState.viteServer = null

		// Re-throw with context if not already a server error
		if (error instanceof Error && !error.message.includes('Vite server')) {
			throw new Error(`Vite server restart failed: ${error.message}`)
		}
		throw error
	}
}

export const RestartViteServerTask = task('server:restart-vite', restartViteServer)
export type RestartViteServerTask = GetTaskTypeFor<typeof RestartViteServerTask>

export default RestartViteServerTask
