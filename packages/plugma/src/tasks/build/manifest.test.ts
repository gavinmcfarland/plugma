import type { PluginOptions } from '#core/types.js';
import RestartViteServerTask from '#tasks/server/restart-vite.js';
import { registerCleanup } from '#utils/cleanup.js';
import { cleanManifestFiles } from '#utils/config/clean-manifest-files.js';
import { getFilesRecursively } from '#utils/fs/get-files-recursively.js';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  mockBuildOptions,
  resetMocks,
  setupFsMocks,
} from '../../../test/utils/mock-build.js';
import { createMockBuildFs } from '../../../test/utils/mock-fs.js';
import { createMockGetFilesResult } from '../../../test/utils/mock-get-files.js';
import { createMockTaskContext } from '../../../test/utils/mock-task.js';
import { GetFilesTask } from '../common/get-files.js';
import BuildMainTask from './main.js';
import { BuildManifestTask } from './manifest.js';

// Mock dependencies
vi.mock('#utils/cleanup.js');
vi.mock('#utils/config/clean-manifest-files.js');
vi.mock('#utils/fs/get-files-recursively.js');
vi.mock('#tasks/server/restart-vite.js');
vi.mock('./main.js');
vi.mock('chokidar', () => ({
  default: {
    watch: vi.fn(() => ({
      on: vi.fn(),
      close: vi.fn(),
    })),
  },
}));

// Setup mocks
setupFsMocks();

describe('build-manifest Task', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  describe('Task Definition', () => {
    test('should have correct name', () => {
      expect(BuildManifestTask.name).toBe('build:manifest');
    });
  });

  describe('Task Execution', () => {
    test('should build manifest successfully', async () => {
      const mockFs = createMockBuildFs();
      const { writeFile, mkdir } = await import('node:fs/promises');

      vi.mocked(writeFile).mockResolvedValue(undefined);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const context = createMockTaskContext(mockBuildOptions, {
        [GetFilesTask.name]: createMockGetFilesResult(),
      });

      const result = await BuildManifestTask.run(mockBuildOptions, context);

      expect(result).toEqual({
        raw: createMockGetFilesResult().files.manifest,
        processed: {
          name: 'Test Plugin',
          id: 'test-plugin',
          api: '1.0.0',
          main: 'main.js',
          ui: 'ui.html',
          version: '1.0.0',
        },
      });

      expect(mkdir).toHaveBeenCalledWith(expect.stringContaining('dist'), {
        recursive: true,
      });
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('manifest.json'),
        expect.any(String),
        'utf-8',
      );
    });

    test('should handle missing get-files result', async () => {
      const context = createMockTaskContext(mockBuildOptions);
      await expect(
        BuildManifestTask.run(mockBuildOptions, context),
      ).rejects.toThrow('get-files task must run first');
    });

    test('should handle missing main/ui files', async () => {
      const mockFs = createMockBuildFs();
      const { writeFile, mkdir } = await import('node:fs/promises');

      vi.mocked(writeFile).mockResolvedValue(undefined);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const mockGetFilesResult = createMockGetFilesResult({
        files: {
          manifest: {
            name: 'Test Plugin',
            id: 'test-plugin',
            api: '1.0.0',
            version: '1.0.0',
            main: 'main.js',
          },
          userPkgJson: {
            name: 'test-plugin',
            version: '1.0.0',
          },
        },
      });

      const context = createMockTaskContext(mockBuildOptions, {
        [GetFilesTask.name]: mockGetFilesResult,
      });

      const result = await BuildManifestTask.run(mockBuildOptions, context);

      expect(result.processed).toEqual({
        name: 'Test Plugin',
        id: 'test-plugin',
        api: '1.0.0',
        version: '1.0.0',
        main: 'main.js',
      });
    });

    test('should handle fs errors', async () => {
      const { mkdir } = await import('node:fs/promises');
      vi.mocked(mkdir).mockRejectedValue(
        new Error('Failed to create directory'),
      );

      const context = createMockTaskContext(mockBuildOptions, {
        [GetFilesTask.name]: createMockGetFilesResult(),
      });

      await expect(
        BuildManifestTask.run(mockBuildOptions, context),
      ).rejects.toThrow('Failed to build manifest');
    });

    describe('Watch Mode', () => {
      test('should set up watchers in dev mode', async () => {
        const mockFs = createMockBuildFs();
        const { writeFile, mkdir } = await import('node:fs/promises');
        const chokidar = (await import('chokidar')).default;

        vi.mocked(writeFile).mockResolvedValue(undefined);
        vi.mocked(mkdir).mockResolvedValue(undefined);
        vi.mocked(getFilesRecursively).mockResolvedValue(['src/test.ts']);

        const devOptions: PluginOptions = {
          ...mockBuildOptions,
          command: 'dev',
        };
        const context = createMockTaskContext(devOptions, {
          [GetFilesTask.name]: createMockGetFilesResult(),
        });

        await BuildManifestTask.run(devOptions, context);

        expect(chokidar.watch).toHaveBeenCalledWith([
          expect.stringContaining('manifest.json'),
          expect.stringContaining('package.json'),
        ]);
        expect(chokidar.watch).toHaveBeenCalledWith([
          expect.stringContaining('src'),
        ]);
        expect(registerCleanup).toHaveBeenCalled();
      });

      test('should handle manifest changes', async () => {
        const mockFs = createMockBuildFs();
        const { writeFile, mkdir } = await import('node:fs/promises');
        const chokidar = (await import('chokidar')).default;

        vi.mocked(writeFile).mockResolvedValue(undefined);
        vi.mocked(mkdir).mockResolvedValue(undefined);
        vi.mocked(getFilesRecursively).mockResolvedValue(['src/test.ts']);

        // Mock chokidar to trigger change event with manifest change
        const mockOn = vi.fn((event, callback) => {
          if (event === 'change') {
            callback();
          }
        });
        vi.mocked(chokidar.watch).mockReturnValue({
          on: mockOn,
          close: vi.fn(),
        } as any);

        const devOptions: PluginOptions = {
          ...mockBuildOptions,
          command: 'dev',
        };

        const mockGetFilesResult = createMockGetFilesResult({
          files: {
            manifest: {
              ...createMockGetFilesResult().files.manifest,
              main: 'src/custom-main.ts',
            },
          },
        });

        const context = createMockTaskContext(devOptions, {
          [GetFilesTask.name]: mockGetFilesResult,
        });

        await BuildManifestTask.run(devOptions, context);

        expect(RestartViteServerTask.run).toHaveBeenCalled();
        expect(BuildMainTask.run).toHaveBeenCalledWith(
          expect.objectContaining({
            command: 'dev',
            entry: 'src/custom-main.ts',
          }),
          expect.anything(),
        );
        expect(cleanManifestFiles).toHaveBeenCalledWith(
          expect.objectContaining({ command: 'dev' }),
          expect.anything(),
          'manifest-changed',
        );
      });

      test('should handle new file additions', async () => {
        const mockFs = createMockBuildFs();
        const { writeFile, mkdir } = await import('node:fs/promises');
        const chokidar = (await import('chokidar')).default;

        vi.mocked(writeFile).mockResolvedValue(undefined);
        vi.mocked(mkdir).mockResolvedValue(undefined);
        vi.mocked(getFilesRecursively).mockResolvedValue(['src/test.ts']);

        // Mock chokidar to trigger add event with new main file
        const mockOn = vi.fn((event, callback) => {
          if (event === 'add') {
            callback('src/new-main.ts');
          }
        });
        vi.mocked(chokidar.watch).mockReturnValue({
          on: mockOn,
          close: vi.fn(),
        } as any);

        const devOptions: PluginOptions = {
          ...mockBuildOptions,
          command: 'dev',
        };

        const mockGetFilesResult = createMockGetFilesResult({
          files: {
            manifest: {
              ...createMockGetFilesResult().files.manifest,
              main: 'src/new-main.ts',
            },
          },
        });

        const context = createMockTaskContext(devOptions, {
          [GetFilesTask.name]: mockGetFilesResult,
        });

        await BuildManifestTask.run(devOptions, context);

        expect(BuildMainTask.run).toHaveBeenCalledWith(
          expect.objectContaining({
            command: 'dev',
            entry: 'src/new-main.ts',
          }),
          expect.anything(),
        );
        expect(cleanManifestFiles).toHaveBeenCalledWith(
          expect.objectContaining({ command: 'dev' }),
          expect.anything(),
          'file-added',
        );
      });

      test('should register cleanup in build mode', async () => {
        const mockFs = createMockBuildFs();
        const { writeFile, mkdir } = await import('node:fs/promises');

        vi.mocked(writeFile).mockResolvedValue(undefined);
        vi.mocked(mkdir).mockResolvedValue(undefined);

        const buildOptions: PluginOptions = {
          ...mockBuildOptions,
          command: 'build',
        };
        const context = createMockTaskContext(buildOptions, {
          [GetFilesTask.name]: createMockGetFilesResult(),
        });

        await BuildManifestTask.run(buildOptions, context);

        expect(registerCleanup).toHaveBeenCalled();
      });
    });
  });
});
