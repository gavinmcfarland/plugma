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

// Add new interface for room stats
interface RoomStats {
	room: string
	connections: number
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

interface QueuedMessage {
	event: string
	data: any
	timestamp: number
	room: string
}

/**
 * Creates a new Socket.IO server instance that attaches to an existing HTTP server
 * @param config - Configuration options for the server
 * @returns A proxied Socket.IO server instance with custom functionality
 */
export function createSocketServer(config: ServerConfig): SocketServer {
	const { server, cors, serverOptions = {} } = config
	const messageQueues = new Map<string, QueuedMessage[]>()
	const QUEUE_TIMEOUT = 10000 // 10 seconds in milliseconds

	console.log(chalk.cyan(`\n⚡ Initializing Socket.IO Server...\n`))

	const io = new Server(server, {
		cors: cors ?? {
			origin: '*',
		},
		...serverOptions,
	})

	/**
	 * Gets current statistics for all rooms
	 */
	function getRoomStats(): RoomStats[] {
		const stats: RoomStats[] = []
		io.sockets.adapter.rooms.forEach((sockets, room) => {
			// Filter out socket ID rooms (socket.io creates a room for each socket ID)
			if (!io.sockets.adapter.sids.has(room)) {
				stats.push({
					room,
					connections: sockets.size,
				})
			}
		})
		return stats
	}

	/**
	 * Emits current room statistics to all connected clients
	 */
	function emitRoomStats() {
		const stats = getRoomStats()
		// console.log('Emitting ROOM_STATS to all clients:', stats)
		io.emit('ROOM_STATS', stats)
	}

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

		console.log('Room joined socket', socket.id, room)
		emitRoomStats()

		next()
	}

	/**
	 * Checks if a room has exactly one socket
	 */
	function hasOneSocketOrMore(room: string): boolean {
		const sockets = io.sockets.adapter.rooms.get(room)
		return (sockets?.size ?? 0) >= 1
	}

	/**
	 * Queues a message for a specific room
	 */
	function queueMessage(room: string, event: string, data: any) {
		if (!messageQueues.has(room)) {
			messageQueues.set(room, [])
		}

		messageQueues.get(room)?.push({
			event,
			data,
			timestamp: Date.now(),
			room,
		})

		// Set timeout to clear old messages
		setTimeout(() => {
			const queue = messageQueues.get(room)
			if (queue) {
				const newQueue = queue.filter((msg) => Date.now() - msg.timestamp < QUEUE_TIMEOUT)
				if (newQueue.length === 0) {
					messageQueues.delete(room)
				} else {
					messageQueues.set(room, newQueue)
				}
			}
		}, QUEUE_TIMEOUT)
	}

	/**
	 * Processes queued messages for a room
	 */
	function processQueue(room: string) {
		if (!messageQueues.has(room)) return

		const queue = messageQueues.get(room)
		if (!queue) return

		if (hasOneSocketOrMore(room)) {
			// Add a small delay to ensure the socket is fully connected
			// setTimeout(() => {
			while (queue.length > 0) {
				const msg = queue.shift()
				if (msg && Date.now() - msg.timestamp < QUEUE_TIMEOUT) {
					io.to(room).emit(msg.event, msg.data)
					console.log(`Queued event "${msg.event}" sent to room "${room}" with message:`, msg.data)
				}
			}
			messageQueues.delete(room)
			// }, 100) // Small delay to ensure socket is ready
		}
	}

	// Assign a room to the client based on the source
	io.use(handleRoomAssignment)

	// Connection handler for message routing
	io.on('connection', (socket) => {
		const from = socket.handshake.auth.room
		const joinedRooms = new Set<string>([from])

		// Emit room stats immediately on connection
		emitRoomStats()

		// Track rooms this socket joins
		socket.on('join', (room) => {
			console.log('join', room)
			joinedRooms.add(room)
			emitRoomStats()
		})

		processQueue(from)

		/**
		 * Handles routing of messages to appropriate rooms
		 */
		function handleMessageRouting(event: string, data: any) {
			// Add null check for data
			// NOTE: Not sure in what scenario an event is being sent when there is no data
			if (!data) {
				console.log(`Received event "${event}" with no data`)
				return
			}

			const { room, ...payload } = data

			let newData = {
				sender: socket.id,
				from,
				...payload,
			}

			if (room) {
				if (Array.isArray(room)) {
					// Handle multiple rooms
					for (const r of room) {
						if (hasOneSocketOrMore(r)) {
							io.to(r).emit(event, newData)
							// console.log(`Event "${event}" sent to room "${r}" with message:`, newData)
						} else {
							queueMessage(r, event, newData)
							// console.log(`Event "${event}" queued for room "${r}" with message:`, newData)
						}
					}
				} else {
					// Handle single room
					if (hasOneSocketOrMore(room)) {
						io.to(room).emit(event, newData)
						// console.log(`Event "${event}" sent to room "${room}" with message:`, newData)
					} else {
						queueMessage(room, event, newData)
						// console.log(`Event "${event}" queued for room "${room}" with message:`, newData)
					}
				}
			} else {
				// Emit to all clients if no room is specified
				io.emit(event, newData)
				// console.log(`Event "${event}" broadcasted with message:`, newData)
			}
		}

		// Set up event routing
		socket.onAny(handleMessageRouting)

		// Clean up queues when socket disconnects
		socket.on('disconnect', () => {
			joinedRooms.forEach((room) => {
				if (!hasOneSocketOrMore(room)) {
					messageQueues.delete(room)
				}
			})
			emitRoomStats()
		})
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
