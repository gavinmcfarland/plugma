import type {
	GetTaskTypeFor,
	PluginOptions,
	ResultsOfTask,
} from "#core/types.js";
import { registerCleanup } from "#utils/cleanup.js";
import { Logger } from "#utils/log/logger.js";
import { parse } from "node:url";
import { v4 as uuidv4 } from "uuid";
import { WebSocket, WebSocketServer } from "ws";
import { GetFilesTask } from "../common/get-files.js";
import { task } from "../runner.js";
import { viteState } from "./vite.js";

/**
 * Client information type
 */
interface Client {
	/** WebSocket connection */
	ws: WebSocket;
	/** Client source (plugin-window or browser) */
	source: string;
}

/**
 * Client info for messages
 */
interface ClientInfo {
	/** Unique client ID */
	id: string;
	/** Client source */
	source: string;
}

/**
 * Plugin message type
 */
interface PluginMessage {
	/** Event type */
	event: string;
	/** Message content */
	message: string;
	/** Connected clients list */
	clients?: ClientInfo[];
	/** Single client info */
	client?: ClientInfo;
	/** Message source */
	source: string;
}

/**
 * WebSocket message type
 */
interface WebSocketMessage {
	/** Plugin message content */
	pluginMessage: PluginMessage;
	/** Target plugin ID */
	pluginId: string;
	/** Additional message data */
	[key: string]: unknown;
}

/**
 * Result type for the start-websockets-server task
 */
export interface StartWebSocketsServerResult {
	/** The WebSocket server instance */
	server: WebSocketServer;
	/** The port the server is running on */
	port: number;
}

/**
 * Add these interfaces near the other interfaces
 */
interface QueuedMessage {
	message: string;
	senderId: string;
}

/**
 * Task that starts and manages the WebSocket server for plugin communication.
 *
 * This task is responsible for:
 * 1. Server Lifecycle:
 *    - Starting the WebSocket server
 *    - Managing client connections
 *    - Ensuring proper server shutdown
 * 2. Client Management:
 *    - Tracking connected clients
 *    - Managing client sources
 *    - Maintaining client list
 * 3. Message Handling:
 *    - Broadcasting messages
 *    - Connection health checks
 *    - Error handling
 *
 * The server is only started when:
 * - Running in dev/preview mode
 * - WebSocket communication is enabled
 *
 * @param options - Plugin build options
 * @param context - Task context with results from previous tasks
 * @returns Object containing server instance and port
 */
export const startWebSocketsServer = async (
	options: PluginOptions,
	context: unknown,
): Promise<StartWebSocketsServerResult> => {
	try {
		const log = new Logger({ debug: options.debug });

		// Check if websockets are enabled
		if (!options.websockets) {
			log.debug("WebSocket server disabled - skipping");
			return {
				server: null as unknown as WebSocketServer,
				port: -1,
			};
		}

		// Calculate WebSocket port (Vite port + 1)
		const wsPort = Number.parseInt(String(options.port)) + 1;
		log.debug(`Starting WebSocket server on port ${wsPort}...`);

		// Check if port is already in use
		try {
			const isPortAvailable = await new Promise<boolean>((resolve, reject) => {
				const testServer = new WebSocketServer({ port: wsPort }, () => {
					testServer.close(() => resolve(true));
				});
				testServer.on("error", (error: Error & { code?: string }) => {
					if (error.code === "EADDRINUSE") {
						log.warn(
							`Port ${wsPort} is already in use - skipping WebSocket server creation`,
						);
						resolve(false);
					} else {
						reject(error);
					}
				});
			});

			if (!isPortAvailable) {
				return {
					server: null as unknown as WebSocketServer,
					port: -1,
				};
			}
		} catch (error) {
			log.error("Error checking WebSocket port:", error);
			return {
				server: null as unknown as WebSocketServer,
				port: -1,
			};
		}

		// Create WebSocket server
		const wss = new WebSocketServer({ port: wsPort });

		// Map to store clients with their unique IDs
		const clients = new Map<string, Client>();
		// Queue for storing messages when no plugin-window is connected
		const messageQueue: QueuedMessage[] = [];

		// Function to check if plugin window is connected
		function hasPluginWindowConnection(): boolean {
			return Array.from(clients.values()).some(
				(client) => client.source === "plugin-window",
			);
		}

		// Function to process queued messages
		function processMessageQueue(): void {
			if (!hasPluginWindowConnection()) {
				log.debug("No plugin window connected, skipping queue processing");
				return;
			}

			log.debug(
				`Starting to process ${messageQueue.length} queued messages...`,
			);
			while (messageQueue.length > 0) {
				const { message, senderId } = messageQueue.shift()!;
				log.debug(`Processing queued message: ${message.substring(0, 100)}...`);
				broadcastMessage(message, senderId, false);
			}
			log.debug("Queue processing complete");
		}

		// Updated broadcast function with queue handling
		function broadcastMessage(
			message: string,
			senderId: string,
			shouldQueue = true,
		): void {
			if (viteState.isBuilding) {
				viteState.messageQueue.push({ message, senderId });
				log.debug("Build in progress, queueing message from:", senderId);
				return;
			}

			if (shouldQueue && !hasPluginWindowConnection()) {
				messageQueue.push({ message, senderId });
				log.debug(
					"No plugin window connected, queueing message from:",
					senderId,
				);
				return;
			}

			let sentCount = 0;
			for (const [clientId, { ws }] of clients.entries()) {
				if (clientId !== senderId && ws.readyState === WebSocket.OPEN) {
					ws.send(message);
					sentCount++;
					log.debug(`Message sent to client ${clientId}`, JSON.parse(message));
				}
			}
			log.debug(`Broadcast complete: message sent to ${sentCount} clients`);
		}

		// Handle server errors
		wss.on("error", (error) => {
			log.error("WebSocket server error:", error);
			throw new Error("Server creation failed");
		});

		// Register cleanup handler
		registerCleanup(async () => {
			log.debug("Cleaning up WebSocket server...");

			// Close all client connections first
			for (const [clientId, { ws }] of clients.entries()) {
				try {
					ws.close();
					clients.delete(clientId);
				} catch (error) {
					log.error(`Failed to close client ${clientId}:`, error);
				}
			}

			// Close the server
			await new Promise<void>((resolve) => {
				wss.close(() => {
					log.success("WebSocket server closed");
					resolve();
				});
			});
		});

		// Handle client connections
		wss.on("connection", (ws: WebSocket, req) => {
			const clientId = uuidv4();
			const queryParams = parse(req.url || "", true).query;
			const clientSource = (queryParams.source as string) || "unknown";

			// Store client info
			clients.set(clientId, { ws, source: clientSource });
			log.debug(`Client connected: ${clientId} (${clientSource})`);

			// Process queued messages when plugin-window connects OR reconnects
			if (clientSource === "plugin-window") {
				log.debug(`Processing ${messageQueue.length} queued messages...`);
				processMessageQueue();
				// Also process any messages queued during Vite builds
				if (viteState.messageQueue.length > 0) {
					log.debug(
						`Processing ${viteState.messageQueue.length} Vite-queued messages...`,
					);
					viteState.messageQueue.forEach(({ message, senderId }) => {
						log.debug(`Sending queued message from ${senderId}`);
						broadcastMessage(message, senderId, false);
					});
					viteState.messageQueue.length = 0; // Clear the queue
				}
			}

			// Send server status message
			const statusMessage: WebSocketMessage = {
				pluginMessage: {
					event: "server_status",
					message: "Dev server active",
					source: `server`,
				},
				pluginId: "*",
			};
			ws.send(JSON.stringify(statusMessage));

			// Send initial client list
			const initialMessage: WebSocketMessage = {
				pluginMessage: {
					event: "client_list",
					message: "List of connected clients",
					clients: Array.from(clients.entries()).map(([id, client]) => ({
						id,
						source: client.source,
					})),
					source: clientSource,
				},
				pluginId: "*",
			};
			ws.send(JSON.stringify(initialMessage));

			// Broadcast connection to other clients
			const connectionMessage: WebSocketMessage = {
				pluginMessage: {
					event: "client_connected",
					message: `Client ${clientId} connected`,
					client: { id: clientId, source: clientSource },
					source: clientSource,
				},
				pluginId: "*",
			};
			broadcastMessage(JSON.stringify(connectionMessage), clientId);

			// Handle client disconnection
			ws.on("close", () => {
				log.debug(`Client disconnected: ${clientId} (${clientSource})`);
				clients.delete(clientId);

				// Notify other clients about disconnection
				const disconnectMessage: WebSocketMessage = {
					pluginMessage: {
						event: "client_disconnected",
						message: "Client disconnected",
						client: { id: clientId, source: clientSource },
						source: "server",
					},
					pluginId: "*",
				};
				for (const [otherClientId, { ws: otherWs }] of clients.entries()) {
					if (
						otherClientId !== clientId &&
						otherWs.readyState === WebSocket.OPEN
					) {
						otherWs.send(JSON.stringify(disconnectMessage));
					}
				}
			});

			// Handle messages from clients
			ws.on("message", (data: Buffer) => {
				try {
					const message = JSON.parse(data.toString()) as WebSocketMessage;
					// Use the broadcastMessage function instead of direct broadcasting
					broadcastMessage(JSON.stringify(message), clientId);
				} catch (error) {
					log.error("Failed to parse message:", error);
					// Do not send error back to client
				}
			});
		});

		log.success(`WebSocket server running on ws://localhost:${wsPort}`);

		return {
			server: wss,
			port: wsPort,
		};
	} catch (error) {
		// Re-throw with context if not already a server error
		if (error instanceof Error && !error.message.includes("WebSocket server")) {
			throw new Error(`WebSocket server task failed: ${error.message}`);
		}
		throw error;
	}
};

export const StartWebSocketsServerTask = task(
	"server:websocket",
	startWebSocketsServer,
);
export type StartWebSocketsServerTask = GetTaskTypeFor<
	typeof StartWebSocketsServerTask
>;

export default StartWebSocketsServerTask;
