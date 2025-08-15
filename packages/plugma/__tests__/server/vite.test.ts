import { type ViteDevServer, createServer } from 'vite';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { ResultsOfTask } from '#core/types.js';
import { GetFilesTask, StartViteServerTask } from '#tasks';
import {
  type MockFs,
  createMockFs,
  createMockGetFilesResult,
  createMockGetFilesResultWithoutUi,
} from '#test';
import { createMockViteConfig } from '#test/mocks/vite/mock-vite-config.js';
import { createMockViteServer } from '#test/mocks/vite/mock-vite.js';
import { viteState } from '../../src/utils/vite-state-manager.js';

const mocks = vi.hoisted(() => ({
  registerCleanup: vi.fn(),
}));

vi.mock('vite', () => ({
  createServer: vi.fn(),
}));

vi.mock('#utils/cleanup.js', () => ({
  registerCleanup: mocks.registerCleanup,
}));

describe('Vite Server Tasks', () => {
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

  describe('StartViteServerTask', () => {
    describe('Task Definition', () => {
      test('should have correct name', () => {
        expect(StartViteServerTask.name).toBe('server:start-vite');
      });
    });

    describe('Server Lifecycle', () => {
      test('should start server with correct configuration', async () => {
        const context = {
          [GetFilesTask.name]: {
            ...createMockGetFilesResult(),
            config: mockConfig,
          },
        };

        const result = await StartViteServerTask.run(baseOptions, context);

        expect(result.server).toBe(mockServer);
        expect(createServer).toHaveBeenCalledWith(
          expect.objectContaining({
            root: process.cwd(),
            base: '/',
            server: expect.objectContaining({
              port: baseOptions.port,
              strictPort: true,
              cors: true,
              host: 'localhost',
              middlewareMode: false,
              sourcemapIgnoreList: expect.any(Function),
              hmr: expect.objectContaining({
                port: baseOptions.port,
                protocol: 'ws',
                host: 'localhost',
              }),
            }),
            optimizeDeps: expect.objectContaining({
              entries: expect.any(Array),
            }),
            logLevel: 'error',
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
        const context = {
          [GetFilesTask.name]: createMockGetFilesResult(),
        };

        await StartViteServerTask.run(baseOptions, context);

        expect(mocks.registerCleanup).toHaveBeenCalledWith(
          expect.any(Function),
        );
      });
    });

    describe('Error Handling', () => {
      test('should handle missing get-files result', async () => {
        const context = {} as ResultsOfTask<GetFilesTask>;

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

        await expect(
          StartViteServerTask.run(baseOptions, context),
        ).rejects.toThrow('Vite server task failed: Close failed');
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

      test('should merge configurations from get-files', async () => {
        const context = {
          [GetFilesTask.name]: {
            ...createMockGetFilesResult(),
            config: mockConfig,
          },
        };

        await StartViteServerTask.run(baseOptions, context);

        expect(createServer).toHaveBeenCalledWith(
          expect.objectContaining({
            root: process.cwd(),
            base: '/',
            server: expect.objectContaining({
              port: baseOptions.port,
              strictPort: true,
              cors: true,
              host: 'localhost',
              middlewareMode: false,
              sourcemapIgnoreList: expect.any(Function),
              hmr: expect.objectContaining({
                port: baseOptions.port,
                protocol: 'ws',
                host: 'localhost',
              }),
            }),
            optimizeDeps: expect.objectContaining({
              entries: expect.any(Array),
            }),
            logLevel: 'error',
          }),
        );
      });
    });
  });
});
