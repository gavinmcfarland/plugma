import { beforeEach, describe, expect, test, vi } from 'vitest';
import { WebSocketServer } from 'ws';

import { createStartWebSocketsServerTask } from '#tasks';
import { type MockFs, createMockFs } from '#test';
import {
  type MockWebSocketClient,
  MockWebSocketClientImpl,
  MockWebSocketServer,
} from '#test/mocks/server/mock-websocket.js';

const mocks = vi.hoisted(() => ({
  registerCleanup: vi.fn(),
  getConfig: vi.fn().mockReturnValue({ websockets: true }),
  createDebugAwareLogger: vi.fn().mockReturnValue({
    log: vi.fn(),
  }),
  createSocketServer: vi.fn(),
  http: {
    createServer: vi.fn(),
  },
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

vi.mock('#utils/save-plugma-cli-options.js', () => ({
  getConfig: mocks.getConfig,
}));

vi.mock('#utils/debug-aware-logger.js', () => ({
  createDebugAwareLogger: mocks.createDebugAwareLogger,
}));

vi.mock('#core/websockets/server.js', () => ({
  createSocketServer: mocks.createSocketServer,
}));

vi.mock('node:http', () => ({
  default: mocks.http,
}));

vi.mock('chalk', () => ({
  default: {
    blue: vi.fn((text) => text),
  },
}));

vi.mock('listr2', () => ({
  ListrLogLevels: {
    OUTPUT: 'OUTPUT',
  },
}));

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('test-client-id'),
}));

describe('WebSocket Server Tasks', () => {
  let mockFs: MockFs;
  let mockServer: MockWebSocketServer;
  let mockClient: MockWebSocketClient;
  let mockHttpServer: any;
  let mockSocketServer: any;

  const baseOptions = {
    command: 'dev' as const,
    mode: 'development',
    port: 3002,
    output: 'dist',
    instanceId: 'test',
    debug: false,
    cwd: '/test/dir',
    websockets: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs = createMockFs();
    mockServer = new MockWebSocketServer();
    mockClient = new MockWebSocketClientImpl();
    mockHttpServer = {
      listen: vi.fn((port, callback) => callback && callback()),
    };
    mockSocketServer = {
      on: vi.fn(),
    };

    vi.mocked(WebSocketServer).mockImplementation(
      () => mockServer as unknown as WebSocketServer,
    );
    mocks.http.createServer.mockReturnValue(mockHttpServer);
    mocks.createSocketServer.mockReturnValue(mockSocketServer);
  });

  describe('createStartWebSocketsServerTask', () => {
    test('should create a task with correct title', () => {
      const task = createStartWebSocketsServerTask(baseOptions);

      expect(task.title).toBe('Start WebSocket Server');
      expect(task.task).toBeInstanceOf(Function);
    });

    test('should create subtasks for WebSocket server setup', async () => {
      const task = createStartWebSocketsServerTask(baseOptions);

      // Mock Listr context and task
      const mockContext = {};
      const mockListrTask = {
        newListr: vi.fn().mockResolvedValue({}),
      };

      await task.task(mockContext, mockListrTask);

      // Verify subtasks were created
      expect(mockListrTask.newListr).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Check WebSocket Configuration',
          }),
          expect.objectContaining({
            title: 'Initialize WebSocket Server',
          }),
        ]),
        expect.objectContaining({
          concurrent: false,
          exitOnError: true,
        })
      );
    });

    test('should skip when websockets are disabled', async () => {
      const optionsWithoutWebsockets = {
        ...baseOptions,
        websockets: false,
      };

      const task = createStartWebSocketsServerTask(optionsWithoutWebsockets);
      const mockContext = {};
      const mockListrTask = {
        newListr: vi.fn().mockResolvedValue({}),
      };

      await task.task(mockContext, mockListrTask);

      // Should still create subtasks but they will skip appropriately
      expect(mockListrTask.newListr).toHaveBeenCalled();
    });

    test('should handle test command configuration', async () => {
      const testOptions = {
        ...baseOptions,
        command: 'test' as any,
      };

      mocks.getConfig.mockReturnValue({ websockets: true });

      const task = createStartWebSocketsServerTask(testOptions);
      const mockContext = {};
      const mockListrTask = {
        newListr: vi.fn().mockResolvedValue({}),
      };

      await task.task(mockContext, mockListrTask);

      expect(mockListrTask.newListr).toHaveBeenCalled();
      expect(mocks.getConfig).toHaveBeenCalled();
    });

    test('should configure WebSocket server with correct port', async () => {
      const task = createStartWebSocketsServerTask(baseOptions);
      const mockContext = {};
      const mockListrTask = {
        newListr: vi.fn().mockImplementation((subtasks) => {
          // Execute the Initialize WebSocket Server task
          const initTask = subtasks.find((t: any) => t.title === 'Initialize WebSocket Server');
          if (initTask && !initTask.skip()) {
            return initTask.task();
          }
          return Promise.resolve({});
        }),
      };

      await task.task(mockContext, mockListrTask);

      // Verify HTTP server was created and configured
      expect(mocks.http.createServer).toHaveBeenCalled();
      expect(mocks.createSocketServer).toHaveBeenCalledWith({
        server: mockHttpServer,
        serverOptions: {
          path: '/',
        },
      });
      expect(mockHttpServer.listen).toHaveBeenCalledWith(
        baseOptions.port + 1,
        expect.any(Function)
      );
    });

    test('should set up socket event handlers', async () => {
      const task = createStartWebSocketsServerTask(baseOptions);
      const mockContext = {};
      const mockListrTask = {
        newListr: vi.fn().mockImplementation((subtasks) => {
          // Execute the Initialize WebSocket Server task
          const initTask = subtasks.find((t: any) => t.title === 'Initialize WebSocket Server');
          if (initTask && !initTask.skip()) {
            return initTask.task();
          }
          return Promise.resolve({});
        }),
      };

      await task.task(mockContext, mockListrTask);

      // Verify socket event handlers were set up
      expect(mockSocketServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    test('should store server in context', async () => {
      const task = createStartWebSocketsServerTask(baseOptions);
      const mockContext: any = {};
      const mockListrTask = {
        newListr: vi.fn().mockImplementation((subtasks) => {
          // Execute the Initialize WebSocket Server task
          const initTask = subtasks.find((t: any) => t.title === 'Initialize WebSocket Server');
          if (initTask && !initTask.skip()) {
            return initTask.task();
          }
          return Promise.resolve({});
        }),
      };

      await task.task(mockContext, mockListrTask);

      // Verify server was stored in context
      expect(mockContext.websocketServer).toBe(mockSocketServer);
    });

    test('should handle configuration check for non-test commands', async () => {
      const devOptions = {
        ...baseOptions,
        command: 'dev' as const,
        websockets: false,
      };

      const task = createStartWebSocketsServerTask(devOptions);
      const mockContext = {};
      const mockListrTask = {
        newListr: vi.fn().mockResolvedValue({}),
      };

      await task.task(mockContext, mockListrTask);

      // Should create subtasks even if websockets are disabled
      expect(mockListrTask.newListr).toHaveBeenCalled();
    });

    test('should use correct port calculation', async () => {
      const customPortOptions = {
        ...baseOptions,
        port: 5000,
      };

      const task = createStartWebSocketsServerTask(customPortOptions);
      const mockContext = {};
      const mockListrTask = {
        newListr: vi.fn().mockImplementation((subtasks) => {
          // Execute the Initialize WebSocket Server task
          const initTask = subtasks.find((t: any) => t.title === 'Initialize WebSocket Server');
          if (initTask && !initTask.skip()) {
            return initTask.task();
          }
          return Promise.resolve({});
        }),
      };

      await task.task(mockContext, mockListrTask);

      // Verify correct port calculation (port + 1)
      expect(mockHttpServer.listen).toHaveBeenCalledWith(
        5001, // 5000 + 1
        expect.any(Function)
      );
    });
  });
});
