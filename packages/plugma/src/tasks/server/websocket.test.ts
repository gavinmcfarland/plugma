import type { ResultsOfTask } from '#core/types.js';
import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { WebSocketServer } from 'ws';
import { type MockFs, createMockFs } from '../../../test/utils/mock-fs.js';
import { createMockGetFilesResult } from '../../../test/utils/mock-get-files.js';
import { GetFilesTask } from '../common/get-files.js';
import { StartWebSocketsServerTask } from './websocket.js';

vi.mock('ws', () => ({
  WebSocketServer: vi.fn(),
  WebSocket: {
    OPEN: 1,
  },
}));

vi.mock('#utils/cleanup.js', () => ({
  registerCleanup: vi.fn(),
}));

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('test-client-id'),
}));

interface MockWebSocketClient extends EventEmitter {
  readyState: number;
  OPEN: number;
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

class MockWebSocketServer extends EventEmitter {
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
      client.on('close', () => {
        this.clients.delete(client);
      });
      client.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          client.send(JSON.stringify({ type: 'response', data: message }));
        } catch (error) {
          // Invalid JSON
        }
      });
    });
  }
}

class MockWebSocketClientImpl
  extends EventEmitter
  implements MockWebSocketClient
{
  readyState = 1;
  OPEN = 1;
  send = vi.fn();
  close = vi.fn();
}

describe('WebSocket Server Tasks', () => {
  let mockFs: MockFs;
  let mockServer: MockWebSocketServer;
  let mockClient: MockWebSocketClient;

  const baseOptions = {
    command: 'dev' as const,
    mode: 'development',
    port: 3002,
    output: 'dist',
    instanceId: 'test',
    debug: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs = createMockFs();
    mockServer = new MockWebSocketServer();
    mockClient = new MockWebSocketClientImpl();
    vi.mocked(WebSocketServer).mockImplementation(
      () => mockServer as unknown as WebSocketServer,
    );
  });

  describe('StartWebSocketsServerTask', () => {
    test('should have correct name', () => {
      expect(StartWebSocketsServerTask.name).toBe('server:websocket');
    });

    test('should start WebSocket server with correct port', async () => {
      const context = {
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      const result = await StartWebSocketsServerTask.run(baseOptions, context);

      expect(WebSocketServer).toHaveBeenCalledWith({
        port: baseOptions.port + 1,
      });
      expect(result.server).toBe(mockServer);
      expect(result.port).toBe(baseOptions.port + 1);
    });

    test('should handle client connection with source identification', async () => {
      const context = {
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      const result = await StartWebSocketsServerTask.run(baseOptions, context);
      const req = { url: '?source=plugin-window' };

      result.server.emit('connection', mockClient, req);

      expect(mockClient.send).toHaveBeenCalledWith(
        expect.stringContaining('"event":"client_list"'),
      );
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.stringContaining('"source":"plugin-window"'),
      );
    });

    test('should broadcast messages to other clients', async () => {
      const context = {
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      const result = await StartWebSocketsServerTask.run(baseOptions, context);
      const client1 = new MockWebSocketClientImpl();
      const client2 = new MockWebSocketClientImpl();

      result.server.emit('connection', client1, { url: '?source=browser' });
      result.server.emit('connection', client2, {
        url: '?source=plugin-window',
      });

      const message = {
        pluginMessage: { event: 'test', message: 'hello' },
        pluginId: '*',
      };
      client1.emit('message', Buffer.from(JSON.stringify(message)));

      expect(client2.send).toHaveBeenCalledWith(
        expect.stringContaining('test'),
      );
      expect(client1.send).not.toHaveBeenCalledWith(
        expect.stringContaining('test'),
      );
    });

    test('should handle client disconnection', async () => {
      const context = {
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      const result = await StartWebSocketsServerTask.run(baseOptions, context);
      const client1 = new MockWebSocketClientImpl();
      const client2 = new MockWebSocketClientImpl();

      result.server.emit('connection', client1, { url: '?source=browser' });
      result.server.emit('connection', client2, {
        url: '?source=plugin-window',
      });

      client1.emit('close');

      expect(client2.send).toHaveBeenCalledWith(
        expect.stringContaining('"event":"client_disconnected"'),
      );
    });

    test('should handle server errors', async () => {
      const context = {
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      const result = await StartWebSocketsServerTask.run(baseOptions, context);

      await expect(() =>
        result.server.emit('error', new Error('Server error')),
      ).rejects.toThrow('Server creation failed');
    });

    test('should handle message parsing errors', async () => {
      const context = {
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      const result = await StartWebSocketsServerTask.run(baseOptions, context);
      const client = new MockWebSocketClientImpl();

      result.server.emit('connection', client, { url: '?source=browser' });
      client.emit('message', Buffer.from('invalid json'));

      // Should not throw and handle error gracefully
      expect(client.send).not.toHaveBeenCalled();
    });

    test('should register cleanup handler', async () => {
      const { registerCleanup } = await import('#utils/cleanup.js');

      const context = {
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      await StartWebSocketsServerTask.run(baseOptions, context);

      expect(registerCleanup).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should handle missing get-files result', async () => {
      const context = {} as ResultsOfTask<GetFilesTask>;

      await expect(
        StartWebSocketsServerTask.run(baseOptions, context),
      ).rejects.toThrow('get-files task must run first');
    });
  });
});
