import {
  createMockBuildFs,
  createMockGetFilesResult,
  createMockTaskContext,
  createMockViteServer,
  mockBuildOptions,
  resetMocks,
  setupFsMocks,
  setupViteMock,
} from '#test';
import { build } from 'vite';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GetFilesTask } from '../common/get-files.js';
import { viteState } from '../server/vite.js';
import { BuildMainTask } from './main.js';

// Setup mocks
setupFsMocks();
setupViteMock();

describe('Main Build Tasks', () => {
  beforeEach(() => {
    resetMocks();
    viteState.viteBuild = null;
  });

  describe('Task Definition', () => {
    test('should have correct name', () => {
      expect(BuildMainTask.name).toBe('build:main');
    });
  });

  describe('Task Execution', () => {
    test('should build main script using manifest.main', async () => {
      const fs = createMockBuildFs();
      const mainPath = 'src/plugin-main.ts';
      const getFilesResult = createMockGetFilesResult({
        files: {
          manifest: {
            name: 'Test Plugin',
            id: 'test-plugin',
            version: '1.0.0',
            api: '1.0.0',
            main: mainPath,
          },
        },
      });

      const context = createMockTaskContext({
        [GetFilesTask.name]: getFilesResult,
      });

      await BuildMainTask.run(mockBuildOptions, context);

      expect(build).toHaveBeenCalledWith(
        expect.objectContaining({
          root: process.cwd(),
          base: '/',
          mode: expect.any(String),
          build: expect.objectContaining({
            outDir: expect.any(String),
            emptyOutDir: true,
            sourcemap: true,
            minify: expect.any(Boolean),
            lib: expect.objectContaining({
              entry: expect.stringContaining(mainPath),
              formats: ['iife'],
              name: 'plugin',
              fileName: expect.any(Function),
            }),
            rollupOptions: expect.objectContaining({
              input: expect.stringContaining(mainPath),
              external: ['figma'],
              output: expect.objectContaining({
                globals: expect.objectContaining({
                  figma: 'figma',
                }),
              }),
            }),
          }),
        }),
      );
    });

    test('should skip build when main is not specified', async () => {
      const getFilesResult = createMockGetFilesResult({
        files: {
          manifest: {
            name: 'Test Plugin',
            id: 'test-plugin',
            version: '1.0.0',
            api: '1.0.0',
            // main is intentionally omitted
          },
        },
      });

      const context = createMockTaskContext({
        [GetFilesTask.name]: getFilesResult,
      });

      const result = await BuildMainTask.run(mockBuildOptions, context);

      expect(build).not.toHaveBeenCalled();
      expect(result).toEqual({
        outputPath: expect.stringContaining('main.js'),
      });
    });

    test('should close existing build server', async () => {
      const mockServer = createMockViteServer();
      viteState.viteBuild = mockServer;

      const mainPath = 'src/plugin-main.ts';
      const getFilesResult = createMockGetFilesResult({
        files: {
          manifest: {
            name: 'Test Plugin',
            id: 'test-plugin',
            version: '1.0.0',
            api: '1.0.0',
            main: mainPath,
          },
        },
      });

      const context = createMockTaskContext({
        [GetFilesTask.name]: getFilesResult,
      });

      await BuildMainTask.run(mockBuildOptions, context);

      expect(mockServer.close).toHaveBeenCalled();
    });

    test('should handle missing get-files result', async () => {
      await expect(
        BuildMainTask.run(mockBuildOptions, {} as any),
      ).rejects.toThrow('get-files task must run first');
    });

    test('should handle Vite build errors', async () => {
      const mainPath = 'src/plugin-main.ts';
      const getFilesResult = createMockGetFilesResult({
        files: {
          manifest: {
            name: 'Test Plugin',
            id: 'test-plugin',
            version: '1.0.0',
            api: '1.0.0',
            main: mainPath,
          },
        },
      });
      vi.mocked(build).mockRejectedValueOnce(new Error('Build failed'));

      const context = createMockTaskContext({
        [GetFilesTask.name]: getFilesResult,
      });

      await expect(
        BuildMainTask.run(mockBuildOptions, context),
      ).rejects.toThrow('Failed to build main script: Build failed');
    });
  });
});
