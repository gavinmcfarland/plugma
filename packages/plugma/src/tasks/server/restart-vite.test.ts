import type { ViteDevServer } from 'vite';
import { createServer } from 'vite';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { type MockFs, createMockFs } from '../../../test/utils/mock-fs.js';
import { createMockGetFilesResult } from '../../../test/utils/mock-get-files.js';
import { createMockViteServer } from '../../../test/utils/mock-vite.js';
import { GetFilesTask } from '../common/get-files.js';
import { RestartViteServerTask } from './restart-vite.js';
import { viteState } from './vite.js';

vi.mock('vite', () => ({
  createServer: vi.fn(),
}));

describe('Restart Vite Server Tasks', () => {
  let mockFs: MockFs;
  let mockServer: ViteDevServer;

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
    mockServer = createMockViteServer();
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
      const context = {
        [GetFilesTask.name]: {
          ...createMockGetFilesResult(),
          files: { manifest: {} },
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
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      await RestartViteServerTask.run(baseOptions, context);

      expect(createServer).toHaveBeenCalledWith(
        expect.objectContaining(context[GetFilesTask.name].config.ui.dev),
      );
    });
  });
});
