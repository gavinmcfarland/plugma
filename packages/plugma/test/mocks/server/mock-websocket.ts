import { EventEmitter } from 'node:events';
import { vi } from 'vitest';
import type { WebSocketServer } from 'ws';

export interface MockWebSocketClient extends EventEmitter {
  readyState: number;
  OPEN: number;
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

export class MockWebSocketClientImpl
  extends EventEmitter
  implements MockWebSocketClient
{
  readyState = 1;
  OPEN = 1;
  send = vi.fn();
  close = vi.fn();
}

export class MockWebSocketServer extends EventEmitter {
  clients: Set<MockWebSocketClient>;
  close: ReturnType<typeof vi.fn>;
  options: Record<string, unknown>;
  path: string;
  address: () => { port: number };
  handleUpgrade: ReturnType<typeof vi.fn>;
  shouldHandle: ReturnType<typeof vi.fn>;

  constructor() {
    super();
    this.clients = new Set();
    this.close = vi.fn().mockResolvedValue(undefined);
    this.options = {};
    this.path = '';
    this.address = () => ({ port: 3003 });
    this.handleUpgrade = vi.fn();
    this.shouldHandle = vi.fn();

    this.on('connection', (client: MockWebSocketClient) => {
      this.clients.add(client);

      client.on('message', (data: Buffer) => {
        // Forward message to other clients
        for (const c of this.clients) {
          if (c !== client && c.readyState === c.OPEN) {
            c.send(data.toString());
          }
        }
      });

      client.on('close', () => {
        this.clients.delete(client);
        // Broadcast disconnect to other clients
        for (const c of this.clients) {
          if (c !== client && c.readyState === c.OPEN) {
            c.send(
              JSON.stringify({
                pluginMessage: {
                  event: 'client_disconnected',
                  client: { id: 'test-client-id' },
                },
                pluginId: '*',
              }),
            );
          }
        }
      });

      // Send initial client list
      client.send(
        JSON.stringify({
          pluginMessage: {
            event: 'client_list',
            clients: [{ id: 'test-client-id', source: 'test' }],
          },
          pluginId: '*',
        }),
      );
    });
  }
}

/**
 * Creates a mock WebSocket server for testing.
 */
export function createMockWebSocketServer(): WebSocketServer {
  return new MockWebSocketServer() as unknown as WebSocketServer;
}
