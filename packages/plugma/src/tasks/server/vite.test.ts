import type { ViteDevServer } from 'vite';
import { createServer } from 'vite';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { type MockFs, createMockFs } from '../../../test/utils/mock-fs.js';
import {
  createMockGetFilesResult,
  createMockGetFilesResultWithoutUi,
} from '../../../test/utils/mock-get-files.js';
import { createMockViteServer } from '../../../test/utils/mock-vite.js';
import { GetFilesTask } from '../common/get-files.js';
import { StartViteServerTask, viteState } from './vite.js';

vi.mock('vite', () => ({
  createServer: vi.fn(),
}));

vi.mock('#utils/cleanup.js', () => ({
  registerCleanup: vi.fn(),
}));

describe('Vite Server Tasks', () => {
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

  describe('StartViteServerTask', () => {
    describe('Task Definition', () => {
      test('should have correct name', () => {
        expect(StartViteServerTask.name).toBe('server:start-vite');
      });
    });

    describe('Server Lifecycle', () => {
      test('should start server with correct configuration', async () => {
        const context = {
          [GetFilesTask.name]: createMockGetFilesResult(),
        };

        const result = await StartViteServerTask.run(baseOptions, context);

        expect(result.server).toBe(mockServer);
        expect(createServer).toHaveBeenCalledWith(
          expect.objectContaining({
            server: expect.objectContaining({
              port: 3000,
              strictPort: true,
              host: 'localhost',
              cors: true,
              middlewareMode: false,
              sourcemapIgnoreList: expect.any(Function),
              hmr: expect.objectContaining({
                port: 3000,
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

        await StartViteServerTask.run(baseOptions, context);

        expect(existingServer.close).toHaveBeenCalled();
        expect(createServer).toHaveBeenCalled();
        expect(mockServer.listen).toHaveBeenCalled();
      });

      test('should register cleanup handler', async () => {
        const { registerCleanup } = await import('#utils/cleanup.js');

        const context = {
          [GetFilesTask.name]: createMockGetFilesResult(),
        };

        await StartViteServerTask.run(baseOptions, context);

        expect(registerCleanup).toHaveBeenCalledWith(expect.any(Function));
      });
    });

    describe('Error Handling', () => {
      test('should handle missing get-files result', async () => {
        const context = {};

        await expect(
          StartViteServerTask.run(baseOptions, context),
        ).rejects.toThrow('get-files task must run first');
      });

      test('should handle missing UI in manifest', async () => {
        const context = {
          [GetFilesTask.name]: createMockGetFilesResultWithoutUi(),
        };

        await expect(
          StartViteServerTask.run(baseOptions, context),
        ).rejects.toThrow('UI must be specified in manifest');
      });

      test('should handle server creation errors', async () => {
        const context = {
          [GetFilesTask.name]: createMockGetFilesResult(),
        };

        vi.mocked(createServer).mockRejectedValueOnce(
          new Error('Creation failed'),
        );

        await expect(
          StartViteServerTask.run(baseOptions, context),
        ).rejects.toThrow('Failed to create Vite server');
      });

      test('should handle server start errors', async () => {
        const context = {
          [GetFilesTask.name]: createMockGetFilesResult(),
        };

        vi.mocked(mockServer.listen).mockRejectedValueOnce(
          new Error('Listen failed'),
        );

        await expect(
          StartViteServerTask.run(baseOptions, context),
        ).rejects.toThrow('Failed to start Vite server');
      });

      test('should handle cleanup errors', async () => {
        const existingServer = createMockViteServer();
        vi.mocked(existingServer.close).mockRejectedValueOnce(
          new Error('Close failed'),
        );
        viteState.viteServer = existingServer;

        const context = {
          [GetFilesTask.name]: createMockGetFilesResult(),
        };

        await StartViteServerTask.run(baseOptions, context);

        // Should still create new server even if closing old one fails
        expect(createServer).toHaveBeenCalled();
        expect(mockServer.listen).toHaveBeenCalled();
      });
    });

    describe('Configuration', () => {
      test('should use debug log level when debug is true', async () => {
        const context = {
          [GetFilesTask.name]: createMockGetFilesResult(),
        };

        await StartViteServerTask.run({ ...baseOptions, debug: true }, context);

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

        await StartViteServerTask.run(
          { ...baseOptions, debug: false },
          context,
        );

        expect(createServer).toHaveBeenCalledWith(
          expect.objectContaining({
            logLevel: 'error',
          }),
        );
      });

      test('should merge base config from get-files', async () => {
        const context = {
          [GetFilesTask.name]: createMockGetFilesResult(),
        };

        await StartViteServerTask.run(baseOptions, context);

        expect(createServer).toHaveBeenCalledWith(
          expect.objectContaining(context[GetFilesTask.name].config.vite.dev),
        );
      });

      test('should merge UI config from get-files', async () => {
        const context = {
          [GetFilesTask.name]: createMockGetFilesResult(),
        };

        await StartViteServerTask.run(baseOptions, context);

        expect(createServer).toHaveBeenCalledWith(
          expect.objectContaining(context[GetFilesTask.name].config.ui.dev),
        );
      });
    });
  });
});
