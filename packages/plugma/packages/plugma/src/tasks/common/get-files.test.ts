import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GetFilesError } from '../../errors';
import { GetFilesTask } from './get-files';

const mocks = vi.hoisted(() => ({
  getUserFiles: vi.fn(),
  createConfigs: vi.fn(),
}));

vi.mock('../../utils/files', () => ({
  getUserFiles: mocks.getUserFiles,
}));

vi.mock('../../utils/config', () => ({
  createConfigs: mocks.createConfigs,
}));

describe('get-files Task', () => {
  const baseOptions = {
    command: 'dev' as const,
    mode: 'development',
    port: 3000,
    output: 'dist',
    instanceId: 'test',
    debug: false,
  };

  const baseContext = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Task Definition', () => {
    it('should have correct name', () => {
      expect(GetFilesTask.name).toBe('common:get-files');
    });
  });

  describe('Task Execution', () => {
    it('should load files and create configs successfully', async () => {
      const mockFiles = {
        manifest: { name: 'test-plugin' },
        package: { name: 'test-plugin' },
      };
      const mockConfigs = {
        vite: {},
        tsconfig: {},
      };

      mocks.getUserFiles.mockResolvedValue(mockFiles);
      mocks.createConfigs.mockResolvedValue(mockConfigs);

      const context = {};
      await GetFilesTask.run(baseOptions, context);

      expect(context).toEqual({
        files: mockFiles,
        configs: mockConfigs,
      });
    });

    it('should throw GetFilesError when package.json is missing', async () => {
      mocks.getUserFiles.mockRejectedValue(new Error('File not found'));

      await expect(GetFilesTask.run(baseOptions, baseContext)).rejects.toThrow(
        new GetFilesError(
          'Failed to get user files: File not found',
          'FILE_ERROR',
        ),
      );
    });

    it('should throw GetFilesError when package.json is invalid', async () => {
      mocks.getUserFiles.mockRejectedValue(new Error('Invalid JSON'));

      await expect(GetFilesTask.run(baseOptions, baseContext)).rejects.toThrow(
        new GetFilesError(
          'Failed to get user files: Invalid JSON',
          'FILE_ERROR',
        ),
      );
    });

    it('should throw GetFilesError when manifest is missing required fields', async () => {
      mocks.getUserFiles.mockRejectedValue(
        new Error('Missing required fields'),
      );

      await expect(GetFilesTask.run(baseOptions, baseContext)).rejects.toThrow(
        new GetFilesError(
          'Failed to get user files: Missing required fields',
          'FILE_ERROR',
        ),
      );
    });

    it('should throw GetFilesError when config creation fails', async () => {
      mocks.getUserFiles.mockResolvedValue({
        manifest: { name: 'test-plugin' },
        package: { name: 'test-plugin' },
      });

      mocks.createConfigs.mockRejectedValue(
        new Error('Failed to create configs'),
      );

      await expect(GetFilesTask.run(baseOptions, baseContext)).rejects.toThrow(
        new GetFilesError(
          'Failed to create configs: Failed to create configs',
          'CONFIG_ERROR',
        ),
      );
    });

    it('should handle production mode config', async () => {
      const mockFiles = {
        manifest: { name: 'test-plugin' },
        package: { name: 'test-plugin' },
      };
      const mockConfigs = {
        vite: { mode: 'production' },
        tsconfig: {},
      };

      mocks.getUserFiles.mockResolvedValue(mockFiles);
      mocks.createConfigs.mockResolvedValue(mockConfigs);

      const context = {};
      await GetFilesTask.run({ ...baseOptions, mode: 'production' }, context);

      expect(context).toEqual({
        files: mockFiles,
        configs: mockConfigs,
      });
    });
  });
});
