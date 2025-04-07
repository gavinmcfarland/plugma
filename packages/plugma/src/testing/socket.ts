import { createClient, SocketClient } from '#core/websockets/client.js'

let socket: SocketClient | null = null
let isSocketConnected = false

export function getTestSocket(port: number): SocketClient {
	if (socket) {
		return socket
	}

	console.log('[socket] initializing socket')
	socket = createClient({
		room: 'test',
		url: 'ws://localhost',
		port: port + 1 || (process.env.PORT ? Number(process.env.PORT) + 1 : 3000),
	})

	socket.on('connect', () => {
		console.log('[socket] connected:', socket!.id)
		isSocketConnected = true
	})

	socket.on('disconnect', () => {
		console.log('[socket] disconnected')
		isSocketConnected = false
	})

	socket.on('error', (error) => {
		console.error('[socket] error:', error)
		isSocketConnected = false
	})

	return socket
}

export function isSocketReady(): boolean {
	return isSocketConnected
}
