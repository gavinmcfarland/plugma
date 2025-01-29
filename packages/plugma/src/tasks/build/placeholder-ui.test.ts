import { Logger } from '#utils/log/logger.js';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createMockFs } from '../../../test/utils/mock-fs.js';
import { createMockTaskContext } from '../../../test/utils/mock-task.js';
import { BuildPlaceholderUiTask } from './placeholder-ui.js';

// Create a mock file system instance
const mockFs = createMockFs();

// Base options for tests
const baseOptions = {
  command: 'dev' as const,
  mode: 'development',
  port: 3000,
  output: 'dist',
  instanceId: 'test',
  debug: false,
};

describe('BuildPlaceholderUiTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockFs.clear();
  });

  test('should create UI when manifest has UI and file exists', async () => {
    const log = new Logger({ debug: false });
    const templateContent = '<html><body>Bridge</body></html>';
    const uiPath = '/path/to/ui.html';

    // Setup mock file system
    mockFs.addFiles({
      [uiPath]: 'existing UI file content',
      'apps/figma-bridge.html': templateContent,
    });

    const result = await BuildPlaceholderUiTask.run(
      baseOptions,
      createMockTaskContext({
        files: {
          manifest: { ui: uiPath },
        },
      }),
    );

    // Verify output path
    expect(result.outputPath).toBe('dist/ui.html');

    // Verify template was read
    const writtenContent = await mockFs.readFile('dist/ui.html');
    expect(writtenContent).toContain(templateContent);
    expect(writtenContent).toContain('window.runtimeData');

    // Verify logging
    expect(log.debug).toHaveBeenCalledWith(
      expect.stringContaining('Creating placeholder UI'),
    );
    expect(log.success).toHaveBeenCalledWith(
      'Placeholder UI created successfully',
    );
  });

  test('should skip when manifest has no UI', async () => {
    const log = new Logger({ debug: false });

    const result = await BuildPlaceholderUiTask.run(
      baseOptions,
      createMockTaskContext({
        files: {
          manifest: {},
        },
      }),
    );

    expect(result.outputPath).toBe('dist/ui.html');
    expect(log.debug).toHaveBeenCalledWith(
      'No UI specified in manifest, skipping placeholder UI',
    );
  });

  test('should skip when UI file does not exist', async () => {
    const log = new Logger({ debug: false });

    const result = await BuildPlaceholderUiTask.run(
      baseOptions,
      createMockTaskContext({
        files: {
          manifest: { ui: '/path/to/nonexistent.html' },
        },
      }),
    );

    expect(result.outputPath).toBe('dist/ui.html');
    expect(log.debug).toHaveBeenCalledWith(
      expect.stringContaining('UI file not found'),
    );
  });

  test('should inject runtime data correctly', async () => {
    const templateContent = '<html><body>Bridge</body></html>';
    const uiPath = '/path/to/ui.html';
    const options = {
      ...baseOptions,
      port: 3000,
    };

    mockFs.addFiles({
      [uiPath]: 'existing UI file content',
      'apps/figma-bridge.html': templateContent,
    });

    await BuildPlaceholderUiTask.run(
      options,
      createMockTaskContext({
        files: {
          manifest: { ui: uiPath },
        },
      }),
    );

    const writtenContent = await mockFs.readFile('dist/ui.html');
    const runtimeData = JSON.parse(
      writtenContent.match(/window\.runtimeData = (.*);/)?.[1] || '{}',
    );

    expect(runtimeData).toEqual({
      ...options,
      manifest: { ui: uiPath },
    });
  });

  test('should handle invalid template file', async () => {
    const uiPath = '/path/to/ui.html';

    mockFs.addFiles({
      [uiPath]: 'existing UI file content',
      'apps/figma-bridge.html': 'invalid template without body tag',
    });

    await expect(
      BuildPlaceholderUiTask.run(
        baseOptions,
        createMockTaskContext({
          files: {
            manifest: { ui: uiPath },
          },
        }),
      ),
    ).rejects.toThrow('Invalid template file: missing <body> tag');
  });

  test('should handle missing template file', async () => {
    const uiPath = '/path/to/ui.html';

    mockFs.addFiles({
      [uiPath]: 'existing UI file content',
    });

    await expect(
      BuildPlaceholderUiTask.run(
        baseOptions,
        createMockTaskContext({
          files: {
            manifest: { ui: uiPath },
          },
        }),
      ),
    ).rejects.toThrow('Template file not found');
  });

  test('should register cleanup in development mode', async () => {
    const { rm } = await import('node:fs/promises');
    const templateContent = '<html><body>Bridge</body></html>';
    const uiPath = '/path/to/ui.html';

    mockFs.addFiles({
      [uiPath]: 'existing UI file content',
      'apps/figma-bridge.html': templateContent,
    });

    await BuildPlaceholderUiTask.run(
      baseOptions,
      createMockTaskContext({
        files: {
          manifest: { ui: uiPath },
        },
      }),
    );

    // Get the cleanup function
    const cleanupFn = vi.mocked(rm).mock.calls[0][0];
    expect(cleanupFn).toBe('dist/ui.html');
  });

  test('should not register cleanup in build mode', async () => {
    const { rm } = await import('node:fs/promises');
    const templateContent = '<html><body>Bridge</body></html>';
    const uiPath = '/path/to/ui.html';

    mockFs.addFiles({
      [uiPath]: 'existing UI file content',
      'apps/figma-bridge.html': templateContent,
    });

    await BuildPlaceholderUiTask.run(
      { ...baseOptions, command: 'build' },
      createMockTaskContext({
        files: {
          manifest: { ui: uiPath },
        },
      }),
    );

    // Verify rm was not called
    expect(rm).not.toHaveBeenCalled();
  });

  test('should handle missing get-files result', async () => {
    await expect(
      BuildPlaceholderUiTask.run(baseOptions, createMockTaskContext({})),
    ).rejects.toThrow('get-files task must run first');
  });
});
