import type {
  GetTaskTypeFor,
  PluginOptions,
  ResultsOfTask,
} from '#core/types.js';
import { registerCleanup } from '#utils/cleanup.js';
import { Logger } from '#utils/log/logger.js';
import { parse } from 'node:url';
import { v4 as uuidv4 } from 'uuid';
import { WebSocket, WebSocketServer } from 'ws';
import { GetFilesTask } from '../common/get-files.js';
import { task } from '../runner.js';

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
 * Task that starts and manages the WebSocket server for plugin communication.
 *
 * This task is responsible for:
 * 1. Server Lifecycle:
 *    - Starting the WebSocket server
 *    - Managing client connections
 *    - Handling cleanup on exit
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
  context: ResultsOfTask<GetFilesTask>,
): Promise<StartWebSocketsServerResult> => {
  try {
    const log = new Logger({ debug: options.debug });

    // Get files from previous task
    const fileResult = context[GetFilesTask.name];
    if (!fileResult) {
      throw new Error('get-files task must run first');
    }

    // Calculate WebSocket port (Vite port + 1)
    const wsPort = options.port + 1;
    log.debug(`Starting WebSocket server on port ${wsPort}...`);

    // Create WebSocket server
    const wss = new WebSocketServer({ port: wsPort });

    // Map to store clients with their unique IDs
    const clients = new Map<string, Client>();

    // Function to broadcast messages to clients except sender
    function broadcastMessage(message: string, senderId: string): void {
      clients.forEach(({ ws }, clientId) => {
        if (clientId !== senderId && ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }

    // Handle server errors
    wss.on('error', (error) => {
      log.error('WebSocket server error:', error);
      throw new Error('Server creation failed');
    });

    // Register cleanup handler
    registerCleanup(async () => {
      log.debug('Cleaning up WebSocket server...');
      await new Promise<void>((resolve) => {
        wss.close(() => {
          log.success('WebSocket server closed');
          resolve();
        });
      });
    });

    // Handle client connections
    wss.on('connection', (ws: WebSocket, req) => {
      const clientId = uuidv4();
      const queryParams = parse(req.url || '', true).query;
      const clientSource = (queryParams.source as string) || 'unknown';

      // Store client info
      clients.set(clientId, { ws, source: clientSource });
      log.debug(`Client connected: ${clientId} (${clientSource})`);

      // Send initial client list
      const initialMessage: WebSocketMessage = {
        pluginMessage: {
          event: 'client_list',
          message: 'List of connected clients',
          clients: Array.from(clients.entries()).map(([id, client]) => ({
            id,
            source: client.source,
          })),
          source: clientSource,
        },
        pluginId: '*',
      };
      ws.send(JSON.stringify(initialMessage));

      // Broadcast connection to other clients
      const connectionMessage: WebSocketMessage = {
        pluginMessage: {
          event: 'client_connected',
          message: `Client ${clientId} connected`,
          client: { id: clientId, source: clientSource },
          source: clientSource,
        },
        pluginId: '*',
      };
      broadcastMessage(JSON.stringify(connectionMessage), clientId);

      // Handle messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          log.debug('Received message:', message);
          broadcastMessage(JSON.stringify(message), clientId);
        } catch (error) {
          log.error('Failed to parse message:', error);
        }
      });

      // Handle client disconnection
      ws.on('close', () => {
        clients.delete(clientId);
        log.debug(`Client disconnected: ${clientId}`);

        const disconnectMessage: WebSocketMessage = {
          pluginMessage: {
            event: 'client_disconnected',
            message: `Client ${clientId} disconnected`,
            client: { id: clientId, source: clientSource },
            source: clientSource,
          },
          pluginId: '*',
        };
        broadcastMessage(JSON.stringify(disconnectMessage), clientId);
      });

      // Handle client errors
      ws.on('error', (error) => {
        log.error(`Client ${clientId} error:`, error);
      });
    });

    log.success(`WebSocket server running on ws://localhost:${wsPort}`);

    return {
      server: wss,
      port: wsPort,
    };
  } catch (error) {
    // Re-throw with context if not already a server error
    if (error instanceof Error && !error.message.includes('WebSocket server')) {
      throw new Error(`WebSocket server task failed: ${error.message}`);
    }
    throw error;
  }
};

export const StartWebSocketsServerTask = task(
  'server:websocket',
  startWebSocketsServer,
);
export type StartWebSocketsServerTask = GetTaskTypeFor<
  typeof StartWebSocketsServerTask
>;

export default StartWebSocketsServerTask;
