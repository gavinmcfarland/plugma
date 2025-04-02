import { Server, ServerOptions } from 'socket.io'
import chalk from 'chalk'
import type { Server as HttpServer } from 'node:http'
import { WebSocketServer } from 'ws'

/**
 * Interface defining the methods available on the server
 * Extends Socket.IO Server to include any custom methods
 */
export interface SocketServer extends Omit<Server, 'emit'> {
	// Add custom emit method signature if needed
	emit: (event: string, data: any, callback?: (response: any) => void) => SocketServer
}

/**
 * Configuration options for creating a server
 */
export interface ServerConfig {
	server: HttpServer | WebSocketServer
	cors?: {
		origin: string | string[]
		credentials?: boolean
	}
	serverOptions?: Partial<ServerOptions>
}

/**
 * Creates a new Socket.IO server instance that attaches to an existing HTTP server
 * @param config - Configuration options for the server
 * @returns A proxied Socket.IO server instance with custom functionality
 */
export function createSocketServer(config: ServerConfig): SocketServer {
	const { server, cors, serverOptions = {} } = config

	console.log(chalk.cyan(`\n⚡ Initializing Socket.IO Server...\n`))

	const io = new Server(server, {
		cors: cors ?? {
			origin: '*',
		},
		...serverOptions,
	})

	/**
	 * Middleware to handle room assignment for incoming socket connections
	 * @param socket - The socket attempting to connect
	 * @param next - Middleware callback function
	 */
	function handleRoomAssignment(socket: any, next: (err?: Error) => void) {
		const room = socket.handshake.auth.room
		if (!room) {
			return next(new Error('Room not provided'))
		}
		socket.join(room)
		next()
	}

	// Assign a room to the client based on the source
	io.use(handleRoomAssignment)

	// Connection handler for message routing
	io.on('connection', (socket) => {
		const from = socket.handshake.auth.room

		/**
		 * Handles routing of messages to appropriate rooms
		 */
		function handleMessageRouting(event: string, data: any) {
			const { room, ...payload } = data

			let message = {
				sender: socket.id,
				from,
				...payload,
			}

			if (room) {
				if (Array.isArray(room)) {
					// Emit to multiple rooms
					for (const r of room) {
						io.to(r).emit(event, message)
					}
					console.log(`Event "${event}" sent to rooms [${room.join(', ')}] with message:`, message)
				} else {
					// Emit to a single room
					io.to(room).emit(event, message)
					console.log(`Event "${event}" sent to room "${room}" with message:`, message)
				}
			} else {
				// Emit to all clients if no room is specified
				io.emit(event, { message })
				console.log(`Event "${event}" broadcasted with message:`, message)
			}
		}

		// Set up event routing
		socket.onAny(handleMessageRouting)
	})

	// // Custom emit function
	// function emit(
	// 	event: string,
	// 	data: any,
	// 	callback?: (response: any) => void
	// ): SocketServer {
	// 	if (data?.target) {
	// 		// Filter sockets by target source
	// 		const targetClients = Array.from(
	// 			io.sockets.sockets.values()
	// 		).filter((client) => client.handshake.auth.source === data.target);

	// 		// Emit to matching clients
	// 		for (const targetClient of targetClients) {
	// 			targetClient.emit(event, data, callback);
	// 		}
	// 	} else {
	// 		// If no target specified, emit to all clients as before
	// 		io.emit(event, data, callback);
	// 	}
	// 	return proxy;
	// }

	// Create a proxy that forwards all methods from the server
	// while preserving our custom methods
	const proxy = new Proxy<SocketServer>(io as unknown as SocketServer, {
		get(room, prop, receiver) {
			// if (prop === "emit") {
			// 	return emit;
			// }
			return Reflect.get(room, prop, receiver)
		},
	})

	return proxy
}
