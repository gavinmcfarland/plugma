import {
  BuildMainTask,
  BuildManifestTask,
  GetFilesTask,
  ShowPlugmaPromptTask,
  StartViteServerTask,
  StartWebSocketsServerTask,
  WrapPluginUiTask,
} from '#tasks';
import { serial } from '#tasks/runner.js';
import { Logger } from '#utils/log/logger.js';
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

// Mock nanoid and getRandomPort
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test-instance-id'),
}));

vi.mock('../utils/get-random-port.js', () => ({
  getRandomPort: vi.fn(() => 12345),
}));

// Mock Logger
vi.mock('#utils/log/logger.js', () => {
  const mockLoggerMethods = {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
  return {
    Logger: vi.fn().mockImplementation(() => mockLoggerMethods),
  };
});

describe('Dev Command', () => {
  let mockLogger: ReturnType<typeof Logger>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger = new Logger({ debug: false });
  });

  describe('Task Execution', () => {
    test('should execute tasks in correct order with default options', async () => {
      const options: DevCommandOptions = {
        debug: false,
        command: 'dev',
      };
      await dev(options);

      expect(serial).toHaveBeenCalledWith(
        GetFilesTask,
        ShowPlugmaPromptTask,
        BuildManifestTask,
        WrapPluginUiTask,
        BuildMainTask,
        StartWebSocketsServerTask,
        StartViteServerTask,
      );

      // Verify the options passed to the returned function
      const runTasks = vi.mocked(serial).mock.results[0].value;
      expect(runTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          ...options,
          mode: 'development',
          output: 'dist',
          instanceId: 'test-instance-id',
          port: 12345,
          cwd: expect.any(String),
        }),
      );
    });

    test('should use provided options over defaults', async () => {
      const options: DevCommandOptions = {
        debug: true,
        command: 'dev',
        mode: 'production',
        output: 'custom-dist',
        port: 3000,
        cwd: '/custom/path',
      };
      await dev(options);

      const runTasks = vi.mocked(serial).mock.results[0].value;
      expect(runTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          ...options,
          instanceId: 'test-instance-id',
        }),
      );
    });

    test('should handle errors gracefully', async () => {
      const error = new Error('Task execution failed');
      vi.mocked(serial).mockImplementationOnce(() => () => {
        throw error;
      });

      const options: DevCommandOptions = {
        debug: false,
        command: 'dev',
      };
      await expect(dev(options)).rejects.toThrow(error);
    });

    test('should log appropriate messages during execution', async () => {
      const options: DevCommandOptions = {
        debug: true,
        command: 'dev',
      };

      await dev(options);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting development server...',
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Executing tasks...');
      expect(mockLogger.success).toHaveBeenCalledWith(
        'Development server started successfully',
      );
    });
  });
});
