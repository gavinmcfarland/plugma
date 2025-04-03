import { createClient, type SocketClient } from '../core/websockets/client.js'

/**
 * WebSocket client for test communication with Figma
 * Handles connection management and message passing
 */
export class TestClient {
	private static instance: SocketClient

	/**
	 * Gets the singleton instance of TestClient
	 * @throws {Error} If attempting to get instance before initialization
	 */
	public static getInstance(port?: number): SocketClient {
		if (!TestClient.instance) {
			// Try to get port from environment variable if not provided
			const envPort = process.env.PORT
			const finalPort = port || (envPort ? Number(envPort) : 9001)

			console.log('Create client')

			let socket = createClient({
				room: 'test',
				url: 'ws://localhost',
				port: finalPort + 1,
			})

			TestClient.instance = socket

			TestClient.instance.on('connect', () => {
				console.log('socket id', socket.id)
			})
		}
		return TestClient.instance
	}
}
