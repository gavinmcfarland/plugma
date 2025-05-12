import { createSocketServer } from '../core/websockets/server.js'
import http from 'http'
import { getConfig } from '../utils/save-plugma-cli-options.js'
import { ListrLogger, ListrLogLevels, ListrTask } from 'listr2'
import { BuildCommandOptions, DevCommandOptions, PreviewCommandOptions } from '../utils/create-options.js'
import { createDebugAwareLogger } from '../utils/debug-aware-logger.js'

/**
 * Gets the WebSocket server port from options or environment
 * @param options Plugin options containing optional port configuration
 * @returns Configured port number
 */
const getWebSocketPort = (options: any): number => {
	const defaultPort = 8080
	const port = options.port || process.env.PORT || defaultPort
	return Number(port) + 1 // WebSocket server runs on port + 1
}

/**
 * Creates a listr2 task for starting the WebSocket server
 */
export const createStartWebSocketsServerTask = <T extends { websocketServer?: any }>(
	options: DevCommandOptions | BuildCommandOptions | PreviewCommandOptions,
): ListrTask<T> => {
	return {
		title: 'Start WebSocket Server',
		task: async (ctx, task) => {
			const config = getConfig()
			const logger = createDebugAwareLogger(options.debug)

			return task.newListr(
				[
					{
						title: 'Check WebSocket Configuration',
						task: async () => {
							// For test command, check config first
							if (options.command === ('test' as any)) {
								if (config.websockets) {
									logger.log(
										ListrLogLevels.OUTPUT,
										'WebSockets are already enabled in test mode, skipping server start',
									)
									return null
								}
							} else {
								// For non-test commands, only start if websockets option is explicitly enabled
								if (!options.websockets) {
									logger.log(
										ListrLogLevels.OUTPUT,
										'WebSockets not enabled in options, skipping server start',
									)
									return null
								}
							}
						},
					},
					{
						title: 'Initialize WebSocket Server',
						task: async () => {
							const port = getWebSocketPort(options)
							const wss = http.createServer()

							// Create and configure WebSocket server
							const io = createSocketServer({
								server: wss,
								serverOptions: {
									path: '/',
								},
							})

							wss.listen(port, () => {
								logger.log(ListrLogLevels.OUTPUT, ['WebSocket server listening on port', port])
							})

							io.on('connection', (socket) => {
								const room = socket.handshake.auth.room
								logger.log(ListrLogLevels.OUTPUT, ['A user connected:', socket.id, room])

								socket.on('disconnect', () => {
									logger.log(ListrLogLevels.OUTPUT, ['User disconnected:', socket.id, room])
								})
							})

							ctx.websocketServer = io
							return io
						},
					},
				],
				{
					concurrent: false,
					exitOnError: true,
				},
			)
		},
	}
}
