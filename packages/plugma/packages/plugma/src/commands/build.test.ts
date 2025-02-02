import {
  BuildMainTask,
  BuildManifestTask,
  BuildUiTask,
  GetFilesTask,
  ShowPlugmaPromptTask,
} from '#tasks';
import * as fs from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskRunner } from '../core/task-runner/task-runner';
import { build } from './build';

vi.mock('node:fs/promises');
vi.mock('../tasks/common/get-files');
vi.mock('../tasks/build/main');
vi.mock('../tasks/build/ui');
vi.mock('../tasks/build/manifest');
vi.mock('../core/task-runner/task-runner');

describe('Build Command', () => {
  beforeEach(() => {
    // Mock manifest.json
    vi.mocked(fs.readFile).mockResolvedValue(
      JSON.stringify({
        name: 'test-plugin',
        version: '1.0.0',
        main: 'dist/main.js',
        ui: 'dist/ui.html',
      }),
    );

    // Mock package.json
    vi.mocked(fs.access).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Task Execution', () => {
    it('should execute tasks in correct order', async () => {
      const options = { debug: false, command: 'build' };
      const serial = vi.spyOn(TaskRunner, 'serial');

      await build(options);

      expect(serial).toHaveBeenCalledWith(
        GetFilesTask,
        ShowPlugmaPromptTask,
        BuildManifestTask,
        BuildUiTask,
        BuildMainTask,
      );
    });

    it('should use provided options', async () => {
      const options = { debug: true, command: 'build' };
      const serial = vi.spyOn(TaskRunner, 'serial');

      await build(options);

      expect(serial).toHaveBeenCalledWith(
        expect.objectContaining({ debug: true }),
        expect.objectContaining({ debug: true }),
        expect.objectContaining({ debug: true }),
        expect.objectContaining({ debug: true }),
        expect.objectContaining({ debug: true }),
      );
    });

    it('should not start servers in build mode', async () => {
      const options = { debug: false, command: 'build' };
      const serial = vi.spyOn(TaskRunner, 'serial');

      await build(options);

      expect(serial).toHaveBeenCalledWith(
        GetFilesTask,
        ShowPlugmaPromptTask,
        BuildManifestTask,
        BuildUiTask,
        BuildMainTask,
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle task execution errors', async () => {
      const error = new Error('Task execution failed');
      vi.mocked(TaskRunner.serial).mockRejectedValueOnce(error);

      await expect(build({ debug: false, command: 'build' })).rejects.toThrow(
        error,
      );
    });
  });
});
