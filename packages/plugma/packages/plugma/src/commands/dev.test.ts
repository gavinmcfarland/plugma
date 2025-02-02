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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskRunner } from '../core/task-runner/task-runner';
import { dev } from './dev';

vi.mock('../core/task-runner/task-runner');

describe('Dev Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Task Execution', () => {
    it('should execute tasks in correct order', async () => {
      const options = { debug: false, command: 'dev' };
      const serial = vi.spyOn(TaskRunner, 'serial');

      await dev(options);

      expect(serial).toHaveBeenCalledWith(
        GetFilesTask,
        ShowPlugmaPromptTask,
        BuildUiTask,
        BuildMainTask,
        BuildManifestTask,
        StartViteServerTask,
        RestartViteServerTask,
        StartWebSocketsServerTask,
      );
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Task execution failed');
      vi.mocked(TaskRunner.serial).mockRejectedValueOnce(error);

      await expect(dev({ debug: false, command: 'dev' })).rejects.toThrow(
        'Failed to start development server: Task execution failed',
      );
    });
  });
});
