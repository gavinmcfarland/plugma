import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Hoist mocks
const mocks = vi.hoisted(() => {
  const pathMock = {
    dirname: vi
      .fn()
      .mockImplementation((p) => p.split('/').slice(0, -1).join('/')),
    join: vi.fn().mockImplementation((...paths) => paths.join('/')),
    resolve: vi.fn().mockImplementation((...paths) => paths.join('/')),
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
    access: vi.fn().mockImplementation(async (path) => {
      if (path.includes('nonexistent')) {
        throw new Error('ENOENT');
      }
      return Promise.resolve();
    }),
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    getDirName: vi.fn(),
    path: {
      ...pathMock,
      default: pathMock,
    },
    loggerInstance: loggerMock,
    Logger: vi.fn().mockImplementation(() => loggerMock),
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

vi.mock('#utils', () => ({
  getDirName: mocks.getDirName,
  Logger: mocks.Logger,
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
  let buildDir: string;
  let templatePath: string;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs = createMockFs();
    mocks.readFile.mockImplementation((path) => mockFs.readFile(path));
    mocks.writeFile.mockImplementation((path, content) =>
      mockFs.writeFile(path, content),
    );

    // Set up the build directory path
    buildDir = '/work/cva/plugma/packages/plugma/src/tasks/build';
    mocks.getDirName.mockReturnValue(buildDir);

    // Calculate the template path
    templatePath = mocks.path.resolve(buildDir, '../../apps/figma-bridge.html');
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockFs.clear();
  });

  test('should create UI file with injected runtime data when manifest has UI and file exists', async () => {
    const templateContent = '<html><head></head><body>Template</body></html>';
    const uiPath = '/path/to/ui.html';
    const expectedRuntimeData = {
      ...baseOptions,
      manifest: { ui: uiPath },
    };

    mockFs.addFiles({
      [uiPath]: '<div>User UI</div>',
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

    // Verify output path
    expect(result.outputPath).toBe('dist/ui.html');

    // Verify runtime data injection
    const writtenContent = (await mockFs.readFile('dist/ui.html')).toString();
    expect(writtenContent).toContain('window.runtimeData =');
    expect(writtenContent).toContain(
      JSON.stringify(expectedRuntimeData, null, 2),
    );

    // Verify template content is preserved
    expect(writtenContent).toContain(templateContent);

    // Verify runtime data is prepended (comes before template)
    const runtimeDataIndex = writtenContent.indexOf('window.runtimeData');
    const templateIndex = writtenContent.indexOf('<html>');
    expect(runtimeDataIndex).toBeLessThan(templateIndex);

    // Verify logging
    expect(mocks.loggerInstance.debug).toHaveBeenCalledWith(
      'Wrapping user plugin UI: /path/to/ui.html...',
      expect.any(Object),
    );
    expect(mocks.loggerInstance.success).toHaveBeenCalledWith(
      'Wrapped plugin UI created successfully',
    );
  });

  test('should skip when manifest has no UI field', async () => {
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
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  test('should skip when UI file does not exist', async () => {
    const uiPath = '/path/to/nonexistent.html';

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
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  test('should handle missing template file', async () => {
    const uiPath = '/path/to/ui.html';

    mockFs.addFiles({
      [uiPath]: '<div>test</div>',
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
      `Template file not found at ${templatePath}`,
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
