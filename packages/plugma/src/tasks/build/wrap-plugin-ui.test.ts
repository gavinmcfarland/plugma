import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Hoist mocks
const mocks = vi.hoisted(() => {
  const pathMock = {
    dirname: vi
      .fn()
      .mockImplementation((p) => p.split('/').slice(0, -1).join('/')),
    join: vi.fn().mockImplementation((...paths) => paths.join('/')),
    resolve: vi.fn().mockImplementation((...paths) => {
      const joined = paths.join('/');
      return joined.startsWith('/') ? joined : `/${joined}`;
    }),
    sep: '/',
  };

  const loggerMock = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  };

  return {
    access: vi.fn().mockImplementation(async () => Promise.resolve()),
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    fileURLToPath: vi.fn().mockReturnValue('src/tasks/build/wrap-plugin-ui.ts'),
    path: {
      ...pathMock,
      default: pathMock,
    },
    Logger: vi.fn().mockImplementation(() => loggerMock),
    loggerInstance: loggerMock,
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

vi.mock('node:url', () => ({
  fileURLToPath: mocks.fileURLToPath,
}));

vi.mock('#utils/log/logger.js', () => ({
  Logger: mocks.Logger,
}));

import { GetFilesTask, WrapPluginUiTask } from '#tasks';
import { type MockFs, createMockFs, createMockTaskContext } from '#test';

const baseOptions = {
  command: 'dev' as const,
  mode: 'development',
  port: 3000,
  output: 'dist',
  instanceId: 'test',
  debug: false,
  cwd: '/work/test',
};

describe('WrapPluginUiTask', () => {
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

  test('should create UI when manifest has UI and file exists', async () => {
    const templateContent =
      '<html><head></head><body><div id="app"></div></body></html>';
    const uiPath = '/path/to/ui.html';
    const templatePath = '/work/test/dist/apps/figma-bridge.html';

    mockFs.addFiles({
      [uiPath]: templateContent,
      [templatePath]: templateContent,
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

    const result = await WrapPluginUiTask.run(baseOptions, context);

    expect(result.outputPath).toBe('dist/ui.html');
    expect(mocks.loggerInstance.debug).toHaveBeenCalledWith(
      `Wrapping user plugin UI: ${uiPath}...`,
    );
  });

  test('should skip when manifest has no UI', async () => {
    const context = createMockTaskContext({
      [GetFilesTask.name]: {
        files: {
          manifest: {},
        },
      },
    });

    const result = await WrapPluginUiTask.run(baseOptions, context);

    expect(result.outputPath).toBeUndefined();
    expect(mocks.loggerInstance.debug).toHaveBeenCalledWith(
      'No UI specified in manifest, skipping build:wrap-plugin-ui task',
    );
  });

  test('should skip when UI file does not exist', async () => {
    const uiPath = '/path/to/nonexistent.html';
    const templatePath = '/work/test/dist/apps/figma-bridge.html';
    const templateContent =
      '<html><head></head><body><div id="app"></div></body></html>';

    mockFs.addFiles({
      [templatePath]: templateContent,
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

    const result = await WrapPluginUiTask.run(baseOptions, context);

    expect(result.outputPath).toBeUndefined();
    expect(mocks.loggerInstance.debug).toHaveBeenCalledWith(
      `UI file not found at ${uiPath}, skipping build:wrap-plugin-ui task`,
    );
  });

  test('should inject runtime data correctly', async () => {
    const templateContent =
      '<html><head></head><body><div id="app"></div></body></html>';
    const uiPath = '/path/to/ui.html';
    const templatePath = '/work/test/dist/apps/figma-bridge.html';

    mockFs.addFiles({
      [uiPath]: templateContent,
      [templatePath]: templateContent,
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

    await WrapPluginUiTask.run(baseOptions, context);

    const writtenContent = await mockFs.readFile('dist/ui.html');
    expect(writtenContent).toContain('window.runtimeData');
    expect(mocks.loggerInstance.success).toHaveBeenCalledWith(
      'Wrapped plugin UI created successfully',
    );
  });

  test('should handle invalid template file', async () => {
    const templateContent = '<html><head></head></html>';
    const uiPath = '/path/to/ui.html';
    const templatePath = '/work/test/dist/apps/figma-bridge.html';

    mockFs.addFiles({
      [uiPath]: templateContent,
      [templatePath]: templateContent,
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

    await expect(WrapPluginUiTask.run(baseOptions, context)).rejects.toThrow(
      'Invalid template file: missing <body> tag',
    );
    expect(mocks.loggerInstance.error).toHaveBeenCalledWith(
      'Failed to wrap user plugin UI:',
      expect.any(Error),
    );
  });

  test('should handle missing template file', async () => {
    const uiPath = '/path/to/ui.html';

    mockFs.addFiles({
      [uiPath]: '<html><body>Bridge</body></html>',
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

    await expect(WrapPluginUiTask.run(baseOptions, context)).rejects.toThrow(
      'Template file not found',
    );
    expect(mocks.loggerInstance.error).toHaveBeenCalledWith(
      'Failed to wrap user plugin UI:',
      expect.any(Error),
    );
  });

  test('should handle missing get-files result', async () => {
    const context = createMockTaskContext({});

    await expect(WrapPluginUiTask.run(baseOptions, context)).rejects.toThrow(
      'get-files task must run first',
    );
  });
});
