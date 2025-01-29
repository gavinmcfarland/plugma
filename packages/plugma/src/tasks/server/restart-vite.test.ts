import { type ViteDevServer, createServer } from 'vite';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { ResultsOfTask, UserFiles } from '#core/types.js';
import { GetFilesTask, RestartViteServerTask } from '#tasks';
import { type MockFs, createMockFs, createMockGetFilesResult } from '#test';
import { createMockViteConfig } from '#test/mocks/vite/mock-vite-config.js';
import { createMockViteServer } from '#test/mocks/vite/mock-vite.js';
import { viteState } from './vite.js';

vi.mock('vite', () => ({
  createServer: vi.fn(),
}));

describe('Restart Vite Server Tasks', () => {
  let mockFs: MockFs;
  let mockServer: ViteDevServer;
  let mockConfig: ReturnType<typeof createMockViteConfig>;

  const baseOptions = {
    command: 'dev' as const,
    mode: 'development',
    port: 3000,
    output: 'dist',
    instanceId: 'test',
    debug: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs = createMockFs();
    mockConfig = createMockViteConfig();
    mockServer = createMockViteServer({ config: mockConfig.ui.dev } as any);
    vi.mocked(createServer).mockResolvedValue(mockServer);
    viteState.viteServer = null;
  });

  describe('Task Definition', () => {
    test('should have correct name', () => {
      expect(RestartViteServerTask.name).toBe('server:restart-vite');
    });
  });

  describe('Server Lifecycle', () => {
    test('should restart Vite server with correct configuration', async () => {
      const context = {
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      const result = await RestartViteServerTask.run(baseOptions, context);

      expect(result.server).toBe(mockServer);
      expect(result.port).toBe(baseOptions.port);
      expect(createServer).toHaveBeenCalledWith(
        expect.objectContaining({
          server: expect.objectContaining({
            port: baseOptions.port,
            strictPort: true,
            host: 'localhost',
            cors: true,
            middlewareMode: false,
            sourcemapIgnoreList: expect.any(Function),
            hmr: expect.objectContaining({
              port: baseOptions.port,
              protocol: 'ws',
              host: 'localhost',
            }),
          }),
        }),
      );
      expect(mockServer.listen).toHaveBeenCalled();
    });

    test('should close existing server before starting new one', async () => {
      const existingServer = createMockViteServer();
      viteState.viteServer = existingServer;

      const context = {
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      const result = await RestartViteServerTask.run(baseOptions, context);

      expect(existingServer.close).toHaveBeenCalled();
      expect(createServer).toHaveBeenCalled();
      expect(mockServer.listen).toHaveBeenCalled();
      expect(result.server).toBe(mockServer);
      expect(viteState.viteServer).toBe(mockServer);
    });

    test('should continue restart even if closing existing server fails', async () => {
      const existingServer = createMockViteServer();
      vi.mocked(existingServer.close).mockRejectedValueOnce(
        new Error('Close failed'),
      );
      viteState.viteServer = existingServer;

      const context = {
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      const result = await RestartViteServerTask.run(baseOptions, context);

      expect(existingServer.close).toHaveBeenCalled();
      expect(createServer).toHaveBeenCalled();
      expect(mockServer.listen).toHaveBeenCalled();
      expect(result.server).toBe(mockServer);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing get-files result', async () => {
      const context = {} as ResultsOfTask<GetFilesTask>;

      await expect(
        RestartViteServerTask.run(baseOptions, context),
      ).rejects.toThrow('get-files task must run first');
    });

    test('should skip restart if no UI is specified', async () => {
      const context: ResultsOfTask<GetFilesTask> = {
        [GetFilesTask.name]: {
          ...createMockGetFilesResult(),
          files: { manifest: {} } as unknown as UserFiles,
        },
      };

      const result = await RestartViteServerTask.run(baseOptions, context);

      expect(result.server).toBeNull();
      expect(createServer).not.toHaveBeenCalled();
    });

    test('should handle server creation errors', async () => {
      const context = {
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      vi.mocked(createServer).mockRejectedValueOnce(
        new Error('Creation failed'),
      );

      await expect(
        RestartViteServerTask.run(baseOptions, context),
      ).rejects.toThrow('Failed to create Vite server');
      expect(viteState.viteServer).toBeNull();
    });

    test('should handle server start errors', async () => {
      const context = {
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      vi.mocked(mockServer.listen).mockRejectedValueOnce(
        new Error('Listen failed'),
      );

      await expect(
        RestartViteServerTask.run(baseOptions, context),
      ).rejects.toThrow('Failed to start Vite server');
      expect(viteState.viteServer).toBeNull();
    });
  });

  describe('Configuration', () => {
    test('should use debug log level when debug is true', async () => {
      const context = {
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      await RestartViteServerTask.run({ ...baseOptions, debug: true }, context);

      expect(createServer).toHaveBeenCalledWith(
        expect.objectContaining({
          logLevel: 'info',
        }),
      );
    });

    test('should use error log level when debug is false', async () => {
      const context = {
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      await RestartViteServerTask.run(
        { ...baseOptions, debug: false },
        context,
      );

      expect(createServer).toHaveBeenCalledWith(
        expect.objectContaining({
          logLevel: 'error',
        }),
      );
    });

    test('should merge UI dev config from get-files', async () => {
      const context = {
        [GetFilesTask.name]: {
          ...createMockGetFilesResult(),
          config: mockConfig,
        },
      };

      await RestartViteServerTask.run(baseOptions, context);

      expect(createServer).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockConfig.ui.dev,
          root: process.cwd(),
          base: '/',
          server: {
            port: baseOptions.port,
            strictPort: true,
            cors: true,
            host: 'localhost',
            middlewareMode: false,
            sourcemapIgnoreList: expect.any(Function),
            hmr: {
              port: baseOptions.port,
              protocol: 'ws',
              host: 'localhost',
            },
          },
          optimizeDeps: {
            entries: expect.any(Array),
          },
          logLevel: 'error',
        }),
      );
    });
  });
});
