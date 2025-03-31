import { beforeEach, describe, expect, test, vi } from 'vitest';
import { WebSocketServer } from 'ws';

import type { ResultsOfTask } from '#core/types.js';
import { GetFilesTask, StartWebSocketsServerTask } from '#tasks';
import { type MockFs, createMockFs, createMockGetFilesResult } from '#test';
import {
  type MockWebSocketClient,
  MockWebSocketClientImpl,
  MockWebSocketServer,
} from '#test/mocks/server/mock-websocket.js';

const mocks = vi.hoisted(() => ({
  registerCleanup: vi.fn(),
}));

// Mock modules
vi.mock('ws', () => ({
  WebSocketServer: vi.fn(),
  WebSocket: {
    OPEN: 1,
  },
}));

vi.mock('#utils/cleanup.js', () => ({
  registerCleanup: mocks.registerCleanup,
}));

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('test-client-id'),
}));

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
      expect(mocks.registerCleanup).toHaveBeenCalledWith(expect.any(Function));
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

      // Clear the initial client list messages
      vi.clearAllMocks();

      const message = {
        pluginMessage: { event: 'test', message: 'hello' },
        pluginId: '*',
      };
      client1.emit('message', Buffer.from(JSON.stringify(message)));

      expect(client2.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(client1.send).not.toHaveBeenCalled();
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

      // Clear the initial client list messages
      vi.clearAllMocks();

      client1.emit('close');

      expect(client2.send).toHaveBeenCalledWith(
        expect.stringContaining('"event":"client_disconnected"'),
      );
    });

    test('should handle server errors', async () => {
      const context = {
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      const { server } = await StartWebSocketsServerTask.run(
        baseOptions,
        context,
      );

      await expect(
        () =>
          new Promise((resolve, reject) => {
            server.on('error', reject);
            server.emit('error', new Error('Server error'));
          }),
      ).rejects.toThrow('Server creation failed');
    });

    test('should handle message parsing errors', async () => {
      const context = {
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      const result = await StartWebSocketsServerTask.run(baseOptions, context);
      const client = new MockWebSocketClientImpl();

      result.server.emit('connection', client, { url: '?source=browser' });

      // Clear just the send mock
      client.send.mockClear();

      client.emit('message', Buffer.from('invalid json'));

      expect(client.send).toHaveBeenCalledTimes(0);
    });

    test('should register cleanup handler', async () => {
      const context = {
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      await StartWebSocketsServerTask.run(baseOptions, context);

      expect(mocks.registerCleanup).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should handle missing get-files result', async () => {
      const context = {} as ResultsOfTask<GetFilesTask>;

      await expect(
        StartWebSocketsServerTask.run(baseOptions, context),
      ).rejects.toThrow('get-files task must run first');
    });
  });
});
