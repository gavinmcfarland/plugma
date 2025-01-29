import type { ResultsOfTask } from '#core/types.js';
import { Logger } from '#utils/logger.js';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  mockBuildOptions,
  resetMocks,
  setupFsMocks,
  setupViteMock,
} from '../../../test/utils/mock-build.js';
import {
  createMockGetFilesResult,
  createMockGetFilesResultWithoutUi,
} from '../../../test/utils/mock-get-files.js';
import { createMockViteServer } from '../../../test/utils/mock-server.js';
import { GetFilesTask } from '../common/get-files.js';
import { viteState } from '../server/vite.js';
import { BuildUiTask } from './ui.js';

// Mock createConfigs
vi.mock('#utils/config/create-configs', () => ({
  createConfigs: () => ({
    vite: {
      build: {
        root: process.cwd(),
        base: '/',
        build: {
          outDir: 'dist',
          emptyOutDir: false,
          sourcemap: true,
          rollupOptions: {
            input: 'src/ui.tsx',
            output: {
              entryFileNames: 'ui.js',
              format: 'iife',
            },
          },
        },
      },
    },
  }),
}));

// Setup mocks
setupFsMocks();
setupViteMock();

describe('UI Build Task', () => {
  beforeEach(() => {
    resetMocks();
    vi.useFakeTimers();
    // Mock performance.now to return predictable values
    let time = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      time += 1000;
      return time;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should build UI in production mode', async () => {
    const { build: viteBuild } = await import('vite');
    const { access } = await import('node:fs/promises');

    // Mock file existence check
    vi.mocked(access).mockResolvedValue(undefined);

    const context = {
      [GetFilesTask.name]: createMockGetFilesResult(),
    };

    const result = await BuildUiTask.run(
      { ...mockBuildOptions, command: 'build' },
      context,
    );

    // Verify output path and duration
    expect(result).toEqual({
      outputPath: 'dist/ui.html',
      duration: 750, // 1000 - 250 Vite overhead
    });

    // Verify Vite build was called with correct config
    expect(viteBuild).toHaveBeenCalledWith(
      expect.objectContaining({
        build: expect.objectContaining({
          minify: true,
        }),
      }),
    );
  });

  test('should build UI in watch mode', async () => {
    const { build: viteBuild } = await import('vite');
    const { access } = await import('node:fs/promises');

    // Mock file existence check
    vi.mocked(access).mockResolvedValue(undefined);

    // Mock build to return a watcher
    vi.mocked(viteBuild).mockResolvedValue({
      close: vi.fn(),
    } as any);

    const context = {
      [GetFilesTask.name]: createMockGetFilesResult(),
    };

    await BuildUiTask.run(
      { ...mockBuildOptions, command: 'build', watch: true },
      context,
    );

    // Verify Vite build was called with watch config
    expect(viteBuild).toHaveBeenCalledWith(
      expect.objectContaining({
        build: expect.objectContaining({
          watch: {},
          minify: true,
        }),
      }),
    );

    // Verify viteState was updated
    expect(viteState.viteUi).toBeDefined();
    expect(viteState.viteUi?.close).toBeDefined();
  });

  test('should skip build if UI file does not exist', async () => {
    const { build: viteBuild } = await import('vite');
    const { access } = await import('node:fs/promises');

    // Mock file existence check to fail
    vi.mocked(access).mockRejectedValue(new Error('File not found'));

    const context = {
      [GetFilesTask.name]: createMockGetFilesResult(),
    };

    const result = await BuildUiTask.run(mockBuildOptions, context);

    // Verify output path is returned but no duration
    expect(result).toEqual({
      outputPath: 'dist/ui.html',
    });

    // Verify Vite build was not called
    expect(viteBuild).not.toHaveBeenCalled();
  });

  test('should skip UI build when UI is not specified', async () => {
    const { build: viteBuild } = await import('vite');

    const context = {
      [GetFilesTask.name]: createMockGetFilesResultWithoutUi(),
    };

    const result = await BuildUiTask.run(mockBuildOptions, context);

    // Verify output path is still returned
    expect(result).toEqual({
      outputPath: 'dist/ui.html',
    });

    // Verify Vite build was not called
    expect(viteBuild).not.toHaveBeenCalled();
  });

  test('should close existing UI server', async () => {
    const { access } = await import('node:fs/promises');
    const mockServer = createMockViteServer();
    viteState.viteUi = mockServer;

    // Mock file existence check
    vi.mocked(access).mockResolvedValue(undefined);

    const context = {
      [GetFilesTask.name]: createMockGetFilesResult(),
    };

    await BuildUiTask.run(mockBuildOptions, context);

    // Verify server was closed
    expect(mockServer.close).toHaveBeenCalled();
  });

  test('should show build status when both main and UI exist', async () => {
    const { access } = await import('node:fs/promises');
    const log = new Logger({ debug: false });

    // Mock both files existing
    vi.mocked(access).mockResolvedValue(undefined);

    const context = {
      [GetFilesTask.name]: createMockGetFilesResult(),
    };

    await BuildUiTask.run({ ...mockBuildOptions, command: 'build' }, context);

    // Verify success message was shown
    expect(log.success).toHaveBeenCalledWith(
      expect.stringContaining('build created in'),
    );
  });

  test('should not show build status in watch mode', async () => {
    const { access } = await import('node:fs/promises');
    const log = new Logger({ debug: false });

    // Mock both files existing
    vi.mocked(access).mockResolvedValue(undefined);

    const context = {
      [GetFilesTask.name]: createMockGetFilesResult(),
    };

    await BuildUiTask.run(
      { ...mockBuildOptions, command: 'build', watch: true },
      context,
    );

    // Verify success message was not shown
    expect(log.success).not.toHaveBeenCalledWith(
      expect.stringContaining('build created in'),
    );
  });

  test('should handle missing get-files result', async () => {
    const context = {} as ResultsOfTask<GetFilesTask>;

    await expect(BuildUiTask.run(mockBuildOptions, context)).rejects.toThrow(
      'get-files task must run first',
    );
  });

  test('should handle Vite build errors', async () => {
    const { build: viteBuild } = await import('vite');
    const { access } = await import('node:fs/promises');

    // Mock file existence check
    vi.mocked(access).mockResolvedValue(undefined);

    // Mock Vite build to fail
    vi.mocked(viteBuild).mockRejectedValue(new Error('Build failed'));

    const context = {
      [GetFilesTask.name]: createMockGetFilesResult(),
    };

    await expect(BuildUiTask.run(mockBuildOptions, context)).rejects.toThrow(
      'Failed to build UI',
    );
  });

  test('should register cleanup in development mode', async () => {
    const { rm, access } = await import('node:fs/promises');

    // Mock file existence check
    vi.mocked(access).mockResolvedValue(undefined);

    const context = {
      [GetFilesTask.name]: createMockGetFilesResult(),
    };

    await BuildUiTask.run({ ...mockBuildOptions, command: 'dev' }, context);

    // Get the cleanup function
    const cleanupFn = vi.mocked(rm).mock.calls[0][0];
    expect(cleanupFn).toBe('dist/ui.html');
  });

  test('should not clean up files in build mode', async () => {
    const { rm, access } = await import('node:fs/promises');

    // Mock file existence check
    vi.mocked(access).mockResolvedValue(undefined);

    const context = {
      [GetFilesTask.name]: createMockGetFilesResult(),
    };

    await BuildUiTask.run({ ...mockBuildOptions, command: 'build' }, context);

    // Verify rm was not called
    expect(rm).not.toHaveBeenCalled();
  });
});
