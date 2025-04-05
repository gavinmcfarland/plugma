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
		async buildStart() {
			socket = createClient({
				room: 'vite',
				url: 'ws://localhost',
				port: port + 1,
			})

			// Delay the message to present it being received before the plugin reloads
			// FIXME: Ideally needs to be changed to event coming from figma bridge so it's more reliable.
			await new Promise((resolve) => setTimeout(resolve, 800))
			socket.emit('BUILD_STARTED', {
				room: 'test',
			})
		},
		async handleHotUpdate({ file }) {
			// Delay the message to present it being received before the plugin reloads
			// FIXME: Ideally needs to be changed to event coming from figma bridge so it's more reliable.
			await new Promise((resolve) => setTimeout(resolve, 600))
			socket.emit('FILE_CHANGED', {
				room: 'test',
			})
		},
	}
}
