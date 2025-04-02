import { io, ManagerOptions, Socket, SocketOptions } from 'socket.io-client'
import chalk from 'chalk'

type ClientType = 'figma' | 'vite' | 'test' | 'browser' | string
/**
 * Interface defining the methods available on a client
 * Extends Socket to include all socket.io methods
 */
export interface SocketClient extends Omit<Socket, 'emit'> {
	emit: (event: string, data: any, room?: ClientType[], callback?: (response: any) => void) => SocketClient
}

/**
 * Configuration options for creating a client
 */
export interface ClientConfig {
	url: string
	room: string
	port?: number
	serverOptions?: Partial<ManagerOptions & SocketOptions>
}

/**
 * Creates a new socket client with standardized methods
 * Uses a Proxy to forward all Socket methods while preserving custom emit behavior
 * @param config - Configuration options for the client
 * @returns A proxied client instance with all Socket methods plus custom functionality
 */
export function createClient(config: ClientConfig): SocketClient {
	const { url, room, port = 8080, serverOptions } = config

	console.log(chalk.cyan(`\n⚡ Starting ${room} Client...\n`))

	// Configured to use `ws` protocol. Can be changed to `http`.
	const socket = io(`${url}:${port}`, {
		auth: { room },
		...serverOptions,
	})

	// Custom emiit function where room is assigned by default

	let source = room

	function emit(event: string, data: any, room?: string[], callback?: (response: any) => void): SocketClient {
		if (room) {
			room.forEach((type) => {
				socket.emit(event, { ...data, room: type }, callback)
			})
		} else {
			socket.emit(event, data, callback)
		}
		return socket as SocketClient
	}

	// Create a proxy that forwards all methods from the socket
	// while preserving our custom emit functionality
	return new Proxy<SocketClient>(socket as SocketClient, {
		get(target, prop, receiver) {
			if (prop === 'emit') {
				return emit
			}
			return Reflect.get(target, prop, receiver)
		},
	})
}
