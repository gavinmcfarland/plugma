import {
  BuildMainTask,
  BuildManifestTask,
  BuildUiTask,
  GetFilesTask,
  RestartViteServerTask,
  ShowPlugmaPromptTask,
  StartViteServerTask,
  StartWebSocketsServerTask,
} from '#tasks';
import { serial } from '#tasks/runner.js';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { dev } from './dev.js';
import type { DevCommandOptions } from './types.js';

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

describe('Dev Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Task Execution', () => {
    test('should execute tasks in correct order', async () => {
      const options: DevCommandOptions = { debug: false, command: 'dev' };
      await dev(options);

      expect(serial).toHaveBeenCalledWith(
        GetFilesTask,
        ShowPlugmaPromptTask,
        BuildManifestTask,
        BuildUiTask,
        BuildMainTask,
        StartViteServerTask,
        RestartViteServerTask,
        StartWebSocketsServerTask,
      );

      // Verify the options passed to the returned function
      const runTasks = vi.mocked(serial).mock.results[0].value;
      expect(runTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          ...options,
          mode: 'development',
          output: 'dist',
          instanceId: expect.any(String),
          port: expect.any(Number),
        }),
      );
    });

    test('should handle errors gracefully', async () => {
      const error = new Error('Task execution failed');
      vi.mocked(serial).mockImplementationOnce(() => () => {
        throw error;
      });

      const options: DevCommandOptions = { debug: false, command: 'dev' };
      await expect(dev(options)).rejects.toThrow(error);
    });
  });
});
