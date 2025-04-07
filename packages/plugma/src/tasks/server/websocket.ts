import type { GetTaskTypeFor, PluginOptions, ResultsOfTask } from '#core/types.js'
import { Logger } from '#utils/log/logger.js'
import { createSocketServer } from '#core/websockets/server.js'
import { GetFilesTask } from '../common/get-files.js'
import { task } from '../runner.js'
import http from 'http'
import { getConfig } from '#utils/set-config.js'
const logger = new Logger()

/**
 * Gets the WebSocket server port from options or environment
 * @param options Plugin options containing optional port configuration
 * @returns Configured port number
 */
const getWebSocketPort = (options: PluginOptions): number => {
	const defaultPort = 8080
	const port = options.port || process.env.PORT || defaultPort
	return Number(port) + 1 // WebSocket server runs on port + 1
}

/**
 * Checks if a port is already in use
 * @param port Port number to check
 * @returns Promise that resolves to true if port is in use
 */
const isPortInUse = async (port: number): Promise<boolean> => {
	return new Promise((resolve) => {
		const server = http.createServer()
		server.once('error', (err: NodeJS.ErrnoException) => {
			if (err.code === 'EADDRINUSE') {
				resolve(true)
			}
		})
		server.once('listening', () => {
			server.close()
			resolve(false)
		})
		server.listen(port)
	})
}

const config = getConfig()

/**
 * Task that starts the WebSocket server and routes messages to the correct client.
 * The WebSocket server is used by `dev`, `preview` and `test` commands.
 * WebSockets is enabled by default for `preview` or `test` commands.
 *
 * @param options - Plugin build options
 * @param context - Task context with results from previous tasks
 * @returns WebSocket server instance
 * @throws Error if server fails to start
 */
export const startWebSocketsServer = async (options: PluginOptions, context: ResultsOfTask<GetFilesTask>) => {
	try {
		const port = getWebSocketPort(options)

		// // Check if port is already in use
		// const portInUse = await isPortInUse(port)
		// if (portInUse) {
		// 	logger.info(`WebSocket server already running on port ${port}, skipping server start`)
		// 	return null
		// }

		// For test command, check config first
		if (options.command === 'test') {
			if (config.websockets) {
				logger.info('WebSockets are already enabled in test mode, skipping server start')
				return null
			}
		} else {
			// For non-test commands, only start if websockets option is explicitly enabled
			if (!options.websockets) {
				logger.info('WebSockets not enabled in options, skipping server start')
				return null
			}
		}

		const wss = http.createServer()

		// Create and configure WebSocket server
		const io = createSocketServer({
			server: wss,
			serverOptions: {
				path: '/',
			},
		})

		wss.listen(port, () => {
			console.log('✔︎ SUCCESS: WebSocket server listening on port', port)
		})

		io.on('connection', (socket) => {
			const room = socket.handshake.auth.room
			logger.debug('A user connected:', socket.id, room)

			socket.on('disconnect', () => {
				logger.debug('User disconnected:', socket.id, room)
			})
		})

		return io
	} catch (error) {
		logger.error('Failed to start WebSocket server:', error)
		throw error
	}
}

export const StartWebSocketsServerTask = task('server:websocket', startWebSocketsServer)

export type StartWebSocketsServerTask = GetTaskTypeFor<typeof StartWebSocketsServerTask>

export default StartWebSocketsServerTask
