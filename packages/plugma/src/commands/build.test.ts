import {
  BuildMainTask,
  BuildManifestTask,
  BuildUiTask,
  GetFilesTask,
  ShowPlugmaPromptTask,
} from '#tasks';
import { serial } from '#tasks/runner.js';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { build } from './build.js';
import type { BuildCommandOptions } from './types.js';

// Mock the task runner module
vi.mock('#tasks/runner.js', () => {
  const runTasksFn = vi.fn(() => Promise.resolve());
  return {
    task: vi.fn((name, fn) => ({ name, run: fn })),
    serial: vi.fn(() => runTasksFn),
    parallel: vi.fn(() => vi.fn(() => Promise.resolve())),
    run: vi.fn(),
    log: vi.fn(),
  };
});

describe('Build Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Task Execution', () => {
    test('should execute tasks in correct order', async () => {
      const options: BuildCommandOptions = { debug: false, command: 'build' };
      await build(options);

      expect(serial).toHaveBeenCalledWith(
        GetFilesTask,
        ShowPlugmaPromptTask,
        BuildMainTask,
        BuildUiTask,
        BuildManifestTask,
      );

      // Verify the options passed to the returned function
      const runTasks = vi.mocked(serial).mock.results[0].value;
      expect(runTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          ...options,
          mode: 'production',
          port: 3000,
          output: 'dist',
          instanceId: expect.any(String),
        }),
      );
    });

    test('should use provided options', async () => {
      const options: BuildCommandOptions = {
        debug: true,
        mode: 'development',
        output: 'build',
        command: 'build',
      };
      await build(options);

      // Verify the options passed to the returned function
      const runTasks = vi.mocked(serial).mock.results[0].value;
      expect(runTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          ...options,
          port: 3000,
          instanceId: expect.any(String),
        }),
      );
    });

    test('should not start servers in build mode', async () => {
      await build({ debug: false, command: 'build' });

      expect(serial).toHaveBeenCalledWith(
        GetFilesTask,
        ShowPlugmaPromptTask,
        BuildMainTask,
        BuildUiTask,
        BuildManifestTask,
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle task execution errors', async () => {
      const error = new Error('Task execution failed');
      vi.mocked(serial).mockImplementationOnce(() => () => {
        throw error;
      });

      await expect(build({ debug: false, command: 'build' })).rejects.toThrow(
        error,
      );
    });
  });
});
