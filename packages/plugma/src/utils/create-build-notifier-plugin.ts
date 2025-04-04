import type { Plugin } from 'vite'
import { createClient, type SocketClient } from '../core/websockets/client.js'

/**
 * Creates a Vite plugin that notifies WebSocket server when file changes are detected
 *
 * @param port - The port number to connect to
 * @returns A Vite plugin that manages WebSocket notifications
 */
export function createBuildNotifierPlugin(port: number): Plugin {
	let socket: SocketClient

	return {
		name: 'build-notifier',
		buildStart() {
			socket = createClient({
				room: 'vite',
				url: 'ws://localhost',
				port: port + 1,
			})
		},
		async handleHotUpdate({ file }) {
			console.log('handleHotUpdate', file)
			const message = {
				room: 'test',
			}

			// Delay the message to present it being received before the plugin reloads
			await new Promise((resolve) => setTimeout(resolve, 1000))
			socket.emit('FILE_CHANGED', message)
		},
	}
}
