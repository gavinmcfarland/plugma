import { createMockViteConfig } from '#test/mocks/vite/mock-vite-config.js';
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
    path: {
      ...pathMock,
      default: pathMock,
    },
    Logger: vi.fn().mockImplementation(() => loggerMock),
    loggerInstance: loggerMock,
    notifyInvalidManifestOptions: vi.fn(),
    createViteConfigs: vi.fn().mockReturnValue({
      ui: {
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
}));

vi.mock('node:path', () => mocks.path);

vi.mock('#utils/log/logger.js', () => ({
  Logger: mocks.Logger,
}));

vi.mock('#utils/config/notify-invalid-manifest-options.js', () => ({
	notifyInvalidManifestOptions: mocks.notifyInvalidManifestOptions,
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

  test('should handle missing get-files result', async () => {
    const context = createMockTaskContext({});

    await expect(BuildUiTask.run(baseOptions, context)).rejects.toThrow(
      'get-files task must run first',
    );
  });

  test('should validate output files after build', async () => {
    const uiContent = '<html><body>UI Content</body></html>';
    const uiPath = '/path/to/ui.html';
    const mainPath = 'src/main.ts';
    const mainContent = 'export default {}';

    mockFs.addFiles({
      [uiPath]: uiContent,
      [mainPath]: mainContent,
    });

    // Mock resolve to return the same path
    mocks.path.resolve.mockImplementation((p: string) => p);

    // Mock access to always return true for both UI and main files
    mocks.access.mockImplementation(() => Promise.resolve());

    // Mock successful build
    mocks.build.mockResolvedValue(undefined);

    const context = createMockTaskContext({
      [GetFilesTask.name]: {
        files: {
          manifest: {
            ui: uiPath,
            main: mainPath,
          },
        },
        config: createMockViteConfig(),
      },
    });

    await BuildUiTask.run(baseOptions, context);

    expect(mocks.notifyInvalidManifestOptions).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      'plugin-built',
    );
  });
});
