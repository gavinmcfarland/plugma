import { PluginMessage } from '#test';
import { EventEmitter } from 'node:events';
import { vi } from 'vitest';
import type { WebSocketServer } from 'ws';

/**
 * Plugin message types
 */
export interface PluginMessage {
  type: string;
  source?: 'toolbar' | 'plugin' | 'ui';
  [key: string]: unknown;
}

/**
 * WebSocket client interface
 */
export interface MockWebSocketClient extends EventEmitter {
  readyState: number;
  OPEN: number;
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  clientId: string;
  source: 'toolbar' | 'plugin' | 'ui';
}

/**
 * WebSocket client implementation
 */
export class MockWebSocketClientImpl
  extends EventEmitter
  implements MockWebSocketClient
{
  readyState = 1;
  OPEN = 1;
  send = vi.fn((data: string) => {
    // Parse and emit message event
    try {
      const message = JSON.parse(data);
      this.emit('message', message);
    } catch {
      // Ignore invalid JSON
    }
  });
  close = vi.fn(() => {
    this.readyState = 3; // CLOSED
    this.emit('close');
  });
  clientId: string;
  source: 'toolbar' | 'plugin' | 'ui';

  constructor(clientId: string, source: 'toolbar' | 'plugin' | 'ui') {
    super();
    this.clientId = clientId;
    this.source = source;
  }
}

/**
 * Mock WebSocket server with toolbar support
 */
export class MockWebSocketServer extends EventEmitter {
  clients: Set<MockWebSocketClient>;
  close: ReturnType<typeof vi.fn>;
  options: Record<string, unknown>;
  path: string;
  address: () => { port: number };
  handleUpgrade: ReturnType<typeof vi.fn>;
  shouldHandle: ReturnType<typeof vi.fn>;
  messageHandlers: Array<(msg: PluginMessage) => void>;

  constructor() {
    super();
    this.clients = new Set();
    this.close = vi.fn().mockResolvedValue(undefined);
    this.options = {};
    this.path = '';
    this.address = () => ({ port: 3003 });
    this.handleUpgrade = vi.fn();
    this.shouldHandle = vi.fn();
    this.messageHandlers = [];

    this.on('connection', (client: MockWebSocketClient) => {
      this.clients.add(client);

      client.on('message', (data: Buffer | string | PluginMessage) => {
        const message = this.parseMessage(data);
        if (!message) {
          this.handleInvalidMessage();
          return;
        }

        // Add source to message if not present
        if (!message.source) {
          message.source = client.source;
        }

        // Notify message handlers
        for (const handler of this.messageHandlers) {
          handler(message);
        }

        // Forward message to other clients
        this.broadcast(message, client);

        // Handle special messages
        this.handleSpecialMessages(message, client);
      });

      client.on('close', () => {
        this.clients.delete(client);
        this.broadcastClientDisconnect(client);
      });

      // Send initial client list
      this.sendClientList(client);

      // Send initial toolbar state for UI clients
      if (client.source === 'ui') {
        this.sendToolbarInit(client);
      }
    });
  }

  /**
   * Parse incoming message
   */
  private parseMessage(
    data: Buffer | string | PluginMessage,
  ): PluginMessage | null {
    try {
      if (typeof data === 'object' && !Buffer.isBuffer(data)) {
        return data as PluginMessage;
      }
      const message = JSON.parse(
        typeof data === 'string' ? data : data.toString(),
      );
      return message as PluginMessage;
    } catch {
      return null;
    }
  }

  /**
   * Broadcast message to other clients
   */
  private broadcast(message: PluginMessage, sender: MockWebSocketClient) {
    for (const client of this.clients) {
      if (client !== sender && client.readyState === client.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Broadcast client disconnect
   */
  private broadcastClientDisconnect(client: MockWebSocketClient) {
    const message: PluginMessage = {
      type: 'client_disconnected',
      source: client.source,
      client: { id: client.clientId, source: client.source },
    };

    this.broadcast(message, client);

    // Notify message handlers
    for (const handler of this.messageHandlers) {
      handler(message);
    }
  }

  /**
   * Send client list to new client
   */
  private sendClientList(client: MockWebSocketClient) {
    const message: PluginMessage = {
      type: 'client_list',
      source: 'plugin',
      clients: Array.from(this.clients).map((c) => ({
        id: c.clientId,
        source: c.source,
      })),
    };

    client.send(JSON.stringify(message));

    // Notify message handlers
    for (const handler of this.messageHandlers) {
      handler(message);
    }
  }

  /**
   * Send initial toolbar state
   */
  private sendToolbarInit(client: MockWebSocketClient) {
    const message: PluginMessage = {
      type: 'toolbar:init',
      source: 'plugin',
      settings: {
        shortcuts: {
          reload: { key: 'r', modifiers: ['ctrl', 'shift'] },
        },
        position: 'bottom',
        visible: true,
      },
    };

    client.send(JSON.stringify(message));

    // Notify message handlers
    for (const handler of this.messageHandlers) {
      handler(message);
    }
  }

  /**
   * Handle special messages
   */
  private handleSpecialMessages(
    message: PluginMessage,
    sender: MockWebSocketClient,
  ) {
    switch (message.type) {
      case 'toolbar:reload':
        this.handleReload();
        break;
      case 'toolbar:toggle':
        this.handleToggleVisibility(message.visible as boolean);
        break;
      case 'toolbar:shortcut':
        this.handleShortcut(message);
        break;
    }
  }

  /**
   * Handle reload action
   */
  private handleReload() {
    const startMessage: PluginMessage = {
      type: 'reload:start',
      source: 'plugin',
    };

    const completeMessage: PluginMessage = {
      type: 'reload:complete',
      source: 'plugin',
    };

    // Notify message handlers
    for (const handler of this.messageHandlers) {
      handler(startMessage);
      handler(completeMessage);
    }

    // Broadcast to all clients
    for (const client of this.clients) {
      client.send(JSON.stringify(startMessage));
      client.send(JSON.stringify(completeMessage));
    }
  }

  /**
   * Handle visibility toggle
   */
  private handleToggleVisibility(visible?: boolean) {
    const message: PluginMessage = {
      type: 'visibility:update',
      source: 'plugin',
      visible: visible ?? true,
    };

    // Notify message handlers
    for (const handler of this.messageHandlers) {
      handler(message);
    }

    // Broadcast to all clients
    for (const client of this.clients) {
      client.send(JSON.stringify(message));
    }
  }

  /**
   * Handle keyboard shortcut
   */
  private handleShortcut(message: PluginMessage) {
    if (message.shortcut === 'reload') {
      this.handleReload();
    }
  }

  /**
   * Handle invalid message
   */
  private handleInvalidMessage() {
    const message: PluginMessage = {
      type: 'error',
      source: 'plugin',
      error: 'Invalid message format',
    };

    // Notify message handlers
    for (const handler of this.messageHandlers) {
      handler(message);
    }

    // Broadcast to all clients
    for (const client of this.clients) {
      client.send(JSON.stringify(message));
    }
  }

  /**
   * Register message handler
   */
  onMessage(handler: (msg: PluginMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Send message from a client
   */
  sendMessage(
    message: PluginMessage,
    source: 'toolbar' | 'plugin' | 'ui' = 'toolbar',
  ): void {
    const client = new MockWebSocketClientImpl(`test-${source}`, source);
    this.emit('connection', client);
    client.emit('message', { ...message, source });
  }

  /**
   * Create and connect a new client
   */
  connectClient(
    clientId: string,
    source: 'toolbar' | 'plugin' | 'ui',
  ): MockWebSocketClient {
    const client = new MockWebSocketClientImpl(clientId, source);
    this.emit('connection', client);
    return client;
  }

  /**
   * Send an invalid message to test error handling
   */
  sendInvalidMessage(): void {
    const client = new MockWebSocketClientImpl('test-invalid', 'plugin');
    this.emit('connection', client);
    client.emit('message', 'invalid json');
  }

  /**
   * Clear all message handlers
   */
  clearMessageHandlers(): void {
    this.messageHandlers = [];
  }
}

/**
 * Creates a mock WebSocket server for testing
 */
export function createMockWebSocketServer(): WebSocketServer {
  return new MockWebSocketServer() as unknown as WebSocketServer;
}

// Export singleton instance for easy access in tests
export const mockWebSocket = new MockWebSocketServer();
