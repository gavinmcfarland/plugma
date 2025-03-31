import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Hoist mocks
const mocks = vi.hoisted(() => {
  const pathMock = {
    dirname: vi.fn().mockReturnValue('src/tasks/build'),
    join: vi.fn().mockImplementation((...paths: string[]) => paths.join('/')),
    resolve: vi.fn().mockImplementation((p: string) => p),
    relative: vi.fn().mockImplementation((from, to) => to),
    sep: '/',
  };

  const loggerMock = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  };

  const watcher = {
    on: vi.fn((event, handler) => {
      if (event === 'change') {
        handler('manifest.json');
      }
      return watcher;
    }),
    close: vi.fn(),
  };

  const readFileMock = vi.fn().mockImplementation((path: string) => {
    if (path === 'package.json') {
      return Promise.resolve(
        JSON.stringify({
          name: 'test-plugin',
          version: '1.0.0',
        }),
      );
    }
    return Promise.reject(new Error('File not found'));
  });

  const buildMainTask = {
    run: vi.fn(),
  };

  return {
    access: vi.fn().mockImplementation(async () => Promise.resolve()),
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: readFileMock,
    writeFile: vi.fn(),
    rm: vi.fn().mockResolvedValue(undefined),
    path: {
      ...pathMock,
      default: pathMock,
      relative: pathMock.relative,
    },
    Logger: vi.fn().mockImplementation(() => loggerMock),
    loggerInstance: loggerMock,
    defaultLogger: loggerMock,
    registerCleanup: vi.fn(),
    unregisterCleanup: vi.fn(),
    cleanManifestFiles: vi.fn(),
    validateOutputFiles: vi.fn(),
    getFilesRecursively: vi.fn().mockResolvedValue([]),
    BuildMainTask: buildMainTask,
    RestartViteServerTask: {
      run: vi.fn(),
      default: {
        run: vi.fn(),
      },
    },
    chokidar: {
      watch: vi.fn((files: string[]) => watcher),
    },
    watcher,
    readFileMock,
    process: {
      cwd: vi.fn().mockReturnValue('/work/cva/plugma/packages/plugma'),
    },
  };
});

// Mock modules
vi.mock('node:fs/promises', () => ({
  access: mocks.access,
  mkdir: mocks.mkdir,
  readFile: mocks.readFile,
  writeFile: mocks.writeFile,
  rm: mocks.rm,
}));

vi.mock('node:path', () => mocks.path);

vi.mock('#utils/log/logger.js', () => ({
  Logger: mocks.Logger,
  defaultLogger: mocks.defaultLogger,
}));

vi.mock('#utils/cleanup.js', () => ({
  registerCleanup: mocks.registerCleanup,
  unregisterCleanup: mocks.unregisterCleanup,
}));

vi.mock('#utils/config/clean-manifest-files.js', () => ({
  cleanManifestFiles: mocks.cleanManifestFiles,
}));

vi.mock('#utils/fs/get-files-recursively.js', () => ({
  getFilesRecursively: mocks.getFilesRecursively,
}));

vi.mock('./main.js', () => ({
  BuildMainTask: mocks.BuildMainTask,
  default: mocks.BuildMainTask,
}));

vi.mock('../server/restart-vite.js', () => ({
  RestartViteServerTask: mocks.RestartViteServerTask,
  default: mocks.RestartViteServerTask.default,
}));

vi.mock('chokidar', () => ({
  default: mocks.chokidar,
}));

vi.mock('node:process', () => mocks.process);

vi.mock('#utils/config/validateOutputFiles.js', () => ({
  validateOutputFiles: mocks.validateOutputFiles,
}));

import { BuildManifestTask, GetFilesTask } from '#tasks';
import { type MockFs, createMockFs, createMockTaskContext } from '#test';

const baseOptions = {
  command: 'dev' as const,
  mode: 'development',
  port: 3000,
  output: 'dist',
  instanceId: 'test',
  debug: false,
};

describe('BuildManifestTask', () => {
  let mockFs: MockFs;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs = createMockFs();
    mocks.access.mockImplementation((path) => mockFs.access(path));
    mocks.readFileMock.mockImplementation((path) => {
      if (path === 'package.json') {
        return Promise.resolve(
          JSON.stringify({
            name: 'test-plugin',
            version: '1.0.0',
          }),
        );
      }
      return mockFs.readFile(path);
    });
    mocks.writeFile.mockImplementation((path, content) =>
      mockFs.writeFile(path, content),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Task Definition', () => {
    test('should have correct name', () => {
      expect(BuildManifestTask.name).toBe('build:manifest');
    });
  });

  describe('Task Execution', () => {
    test('should build manifest successfully', async () => {
      mockFs.addFiles({
        'src/main.ts': 'export default {}',
        'src/ui.html': '<html></html>',
      });

      const context = createMockTaskContext({
        [GetFilesTask.name]: {
          files: {
            manifest: {
              main: 'src/main.ts',
              ui: 'src/ui.html',
            },
          },
        },
      });

      const result = await BuildManifestTask.run(baseOptions, context);

      expect(result).toEqual({
        raw: {
          main: 'src/main.ts',
          ui: 'src/ui.html',
        },
        processed: {
          api: '1.0.0',
          main: 'main.js',
          ui: 'ui.html',
        },
      });
    });

    test('should handle missing get-files result', async () => {
      const context = createMockTaskContext({});

      await expect(BuildManifestTask.run(baseOptions, context)).rejects.toThrow(
        'Failed to build manifest: get-files task must run first',
      );
    });

    test('should handle missing main/ui files', async () => {
      const context = createMockTaskContext({
        [GetFilesTask.name]: {
          files: {
            manifest: {},
          },
        },
      });

      const result = await BuildManifestTask.run(baseOptions, context);

      expect(result).toEqual({
        raw: {},
        processed: {
          api: '1.0.0',
        },
      });
    });

    test('should handle fs errors', async () => {
      // Mock writeFile to reject
      mocks.writeFile.mockRejectedValueOnce(new Error('Failed to write file'));

      const context = createMockTaskContext({
        [GetFilesTask.name]: {
          files: {
            manifest: {
              main: 'src/main.ts',
            },
          },
        },
      });

      await expect(BuildManifestTask.run(baseOptions, context)).rejects.toThrow(
        'Failed to build manifest: Failed to write file',
      );
    });

    describe('Watch Mode', () => {
      test('should set up watchers in dev mode', async () => {
        mockFs.addFiles({
          'src/main.ts': 'export default {}',
        });

        const context = createMockTaskContext({
          [GetFilesTask.name]: {
            files: {
              manifest: {
                main: 'src/main.ts',
              },
            },
          },
        });

        await BuildManifestTask.run(baseOptions, context);

        const watchCalls = mocks.chokidar.watch.mock.calls;
        expect(watchCalls).toHaveLength(2);

        // First call for manifest and package.json
        const firstCall = watchCalls[0];
        expect(firstCall?.[0]).toEqual(['./manifest.json', './package.json']);

        // Second call for src directory
        const secondCall = watchCalls[1];
        expect(secondCall).toEqual([
          ['./src'],
          {
            ignoreInitial: false,
            persistent: true,
          },
        ]);
      });

      test('should handle manifest changes', async () => {
        mockFs.addFiles({
          'src/main.ts': 'export default {}',
        });

        const context = createMockTaskContext({
          [GetFilesTask.name]: {
            files: {
              manifest: {
                main: 'src/main.ts',
              },
            },
          },
        });

        await BuildManifestTask.run(baseOptions, context);

        // Simulate manifest change event
        const onCall = mocks.watcher.on.mock.calls.find(
          (call) => call[0] === 'change',
        );
        if (onCall) {
          const [, handler] = onCall;
          await handler();
        }

        expect(mocks.RestartViteServerTask.default.run).toHaveBeenCalledWith(
          expect.objectContaining({
            command: 'dev',
            mode: 'development',
          }),
          expect.any(Object),
        );
      });

      test('should handle new file additions', async () => {
        mockFs.addFiles({
          'src/main.ts': 'export default {}',
        });

        const mainPath = 'src/new-file.ts';
        const files = {
          manifest: {
            main: mainPath,
          },
        };

        const context = createMockTaskContext({
          [GetFilesTask.name]: {
            files,
          },
        });

        // Mock getFilesRecursively to return empty array so new file isn't in existingFiles
        mocks.getFilesRecursively.mockResolvedValue([]);

        // Mock path.relative to return the same path as in manifest
        mocks.path.relative.mockReturnValue(mainPath);

        // Mock readFile to return manifest with matching main path
        mocks.readFileMock.mockImplementation((path: string) => {
          if (path === 'package.json') {
            return Promise.resolve(
              JSON.stringify({
                name: 'test-plugin',
                version: '1.0.0',
              }),
            );
          }
          if (path === 'manifest.json') {
            return Promise.resolve(
              JSON.stringify({
                main: mainPath,
              }),
            );
          }
          return mockFs.readFile(path);
        });

        await BuildManifestTask.run(baseOptions, context);

        // Simulate file add event with the same path as manifest.main
        const onCall = mocks.watcher.on.mock.calls.find(
          (call) => call[0] === 'add',
        );
        if (onCall) {
          const [, handler] = onCall;
          await handler(mainPath);
        }

        expect(mocks.BuildMainTask.run).toHaveBeenCalledWith(
          expect.objectContaining({
            command: 'dev',
          }),
          expect.any(Object),
        );
      });

      test('should not set up watchers in build mode', async () => {
        mockFs.addFiles({
          'src/main.ts': 'export default {}',
        });

        const context = createMockTaskContext({
          [GetFilesTask.name]: {
            files: {
              manifest: {
                main: 'src/main.ts',
              },
            },
          },
        });

        await BuildManifestTask.run(
          { ...baseOptions, command: 'build' },
          context,
        );

        expect(mocks.chokidar.watch).not.toHaveBeenCalled();
      });
    });
  });
});
