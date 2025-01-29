import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Hoist mocks
const mocks = vi.hoisted(() => {
  const pathMock = {
    dirname: vi.fn().mockReturnValue('src/tasks/build'),
    join: vi.fn().mockImplementation((...paths: string[]) => paths.join('/')),
    resolve: vi.fn().mockImplementation((p: string) => p),
    sep: '/',
  };

  const loggerMock = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  };

  const viteStateMock = {
    viteUi: null,
  };

  return {
    access: vi.fn().mockImplementation(async () => Promise.resolve()),
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    rm: vi.fn().mockResolvedValue(undefined),
    path: {
      ...pathMock,
      default: pathMock,
    },
    Logger: vi.fn().mockImplementation(() => loggerMock),
    loggerInstance: loggerMock,
    registerCleanup: vi.fn(),
    unregisterCleanup: vi.fn(),
    cleanManifestFiles: vi.fn(),
    createViteConfigs: vi.fn().mockReturnValue({
      vite: {
        build: {},
      },
    }),
    build: vi.fn().mockResolvedValue(undefined),
    mergeConfig: vi.fn((config) => config),
    viteState: viteStateMock,
    performance: {
      now: vi.fn().mockReturnValue(1000),
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
}));

vi.mock('#utils/cleanup.js', () => ({
  registerCleanup: mocks.registerCleanup,
  unregisterCleanup: mocks.unregisterCleanup,
}));

vi.mock('#utils/config/clean-manifest-files.js', () => ({
  cleanManifestFiles: mocks.cleanManifestFiles,
}));

vi.mock('#utils/config/create-vite-configs.js', () => ({
  createViteConfigs: mocks.createViteConfigs,
}));

vi.mock('vite', () => ({
  build: mocks.build,
  mergeConfig: mocks.mergeConfig,
}));

vi.mock('../server/vite.js', () => ({
  viteState: mocks.viteState,
}));

vi.mock('node:perf_hooks', () => ({
  performance: mocks.performance,
}));

import { BuildUiTask, GetFilesTask } from '#tasks';
import { type MockFs, createMockFs, createMockTaskContext } from '#test';

const baseOptions = {
  command: 'dev' as const,
  mode: 'development',
  port: 3000,
  output: 'dist',
  instanceId: 'test',
  debug: false,
};

describe('BuildUiTask', () => {
  let mockFs: MockFs;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs = createMockFs();
    mocks.access.mockImplementation((path) => mockFs.access(path));
    mocks.readFile.mockImplementation((path) => mockFs.readFile(path));
    mocks.writeFile.mockImplementation((path, content) =>
      mockFs.writeFile(path, content),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should build UI when manifest has UI and file exists', async () => {
    const uiContent = '<html><body>UI Content</body></html>';
    const uiPath = '/path/to/ui.html';

    mockFs.addFiles({
      [uiPath]: uiContent,
    });

    const context = createMockTaskContext({
      [GetFilesTask.name]: {
        files: {
          manifest: {
            ui: uiPath,
          },
        },
      },
    });

    const result = await BuildUiTask.run(baseOptions, context);

    expect(result.outputPath).toBe('dist/ui.html');
    expect(mocks.loggerInstance.debug).toHaveBeenCalledWith(
      `Building UI from ${uiPath}...`,
    );
    expect(mocks.build).toHaveBeenCalled();
  });

  test('should skip when manifest has no UI', async () => {
    const context = createMockTaskContext({
      [GetFilesTask.name]: {
        files: {
          manifest: {},
        },
      },
    });

    const result = await BuildUiTask.run(baseOptions, context);

    expect(result.outputPath).toBe('dist/ui.html');
    expect(mocks.build).not.toHaveBeenCalled();
  });

  test('should skip when UI file does not exist', async () => {
    const uiPath = '/path/to/nonexistent.html';
    mocks.access.mockImplementation(() => Promise.reject(new Error('ENOENT')));

    const context = createMockTaskContext({
      [GetFilesTask.name]: {
        files: {
          manifest: {
            ui: uiPath,
          },
        },
      },
    });

    const result = await BuildUiTask.run(baseOptions, context);

    expect(result.outputPath).toBe('dist/ui.html');
    expect(mocks.build).not.toHaveBeenCalled();
  });

  test('should register cleanup in development mode', async () => {
    const uiContent = '<html><body>UI Content</body></html>';
    const uiPath = '/path/to/ui.html';

    mockFs.addFiles({
      [uiPath]: uiContent,
    });

    const context = createMockTaskContext({
      [GetFilesTask.name]: {
        files: {
          manifest: {
            ui: uiPath,
          },
        },
      },
    });

    await BuildUiTask.run({ ...baseOptions, command: 'dev' }, context);

    expect(mocks.registerCleanup).toHaveBeenCalledWith(expect.any(Function));

    // Call the cleanup function
    const cleanupFn = mocks.registerCleanup.mock.calls[0][0];
    await cleanupFn();

    expect(mocks.loggerInstance.debug).toHaveBeenCalledWith(
      'Cleaning up UI build...',
    );
    expect(mocks.rm).toHaveBeenCalledWith('dist/ui.html', { force: true });
    expect(mocks.loggerInstance.success).toHaveBeenCalledWith(
      'Cleaned up UI build output',
    );
  });

  test('should handle cleanup errors', async () => {
    const uiContent = '<html><body>UI Content</body></html>';
    const uiPath = '/path/to/ui.html';
    const error = new Error('Failed to remove file');

    mockFs.addFiles({
      [uiPath]: uiContent,
    });

    const context = createMockTaskContext({
      [GetFilesTask.name]: {
        files: {
          manifest: {
            ui: uiPath,
          },
        },
      },
    });

    await BuildUiTask.run({ ...baseOptions, command: 'dev' }, context);

    // Mock rm to throw an error
    mocks.rm.mockRejectedValueOnce(error);

    // Call the cleanup function
    const cleanupFn = mocks.registerCleanup.mock.calls[0][0];
    await cleanupFn();

    expect(mocks.loggerInstance.error).toHaveBeenCalledWith(
      'Failed to clean up UI build output:',
      error,
    );
  });

  test('should not register cleanup in build mode', async () => {
    const uiContent = '<html><body>UI Content</body></html>';
    const uiPath = '/path/to/ui.html';

    mockFs.addFiles({
      [uiPath]: uiContent,
    });

    const context = createMockTaskContext({
      [GetFilesTask.name]: {
        files: {
          manifest: {
            ui: uiPath,
          },
        },
      },
    });

    await BuildUiTask.run({ ...baseOptions, command: 'build' }, context);

    expect(mocks.registerCleanup).toHaveBeenCalled();
    expect(mocks.unregisterCleanup).toHaveBeenCalled();
  });

  test('should handle missing get-files result', async () => {
    const context = createMockTaskContext({});

    await expect(BuildUiTask.run(baseOptions, context)).rejects.toThrow(
      'get-files task must run first',
    );
  });
});
