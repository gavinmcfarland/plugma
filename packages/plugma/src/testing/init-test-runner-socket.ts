import { ListrLogLevels } from 'listr2'
import { createClient, SocketClient } from '../core/websockets/client.js'
import { createDebugAwareLogger } from '../utils/debug-aware-logger.js'

let socket: SocketClient | null = null
let isSocketConnected = false
const logger = createDebugAwareLogger()

export function getTestSocket(port: number): SocketClient {
	if (socket) {
		return socket
	}

	console.log('[socket] initializing socket', port + 1)
	socket = createClient({
		room: 'test',
		url: 'ws://localhost',
		port: port + 1 || (process.env.PORT ? Number(process.env.PORT) + 1 : 3000),
	})

	socket.on('connect', () => {
		logger.log(ListrLogLevels.OUTPUT, ['Socket connected:', socket!.id])
		isSocketConnected = true
	})

	socket.on('disconnect', () => {
		logger.log(ListrLogLevels.OUTPUT, 'Socket disconnected')
		isSocketConnected = false
	})

	socket.on('error', (error) => {
		logger.log(ListrLogLevels.FAILED, ['Socket error:', error])
		isSocketConnected = false
	})

	return socket
}

export function isSocketReady(): boolean {
	return isSocketConnected
}
