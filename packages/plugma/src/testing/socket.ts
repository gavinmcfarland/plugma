import { createClient, SocketClient } from '../core/websockets/client.js'
import { Logger } from '../utils/log/logger.js'

let socket: SocketClient | null = null
let isSocketConnected = false
const logger = new Logger({ debug: false })

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
		logger.debug('[socket] connected:', socket!.id)
		isSocketConnected = true
	})

	socket.on('disconnect', () => {
		logger.debug('[socket] disconnected')
		isSocketConnected = false
	})

	socket.on('error', (error) => {
		logger.error('[socket] error:', error)
		isSocketConnected = false
	})

	return socket
}

export function isSocketReady(): boolean {
	return isSocketConnected
}
