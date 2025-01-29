import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GetFilesError, GetFilesTask } from '#tasks';
import {
  type MockFs,
  createMockFs,
  createMockGetFilesResult,
  createMockViteConfig,
} from '#test';

const mocks = vi.hoisted(() => ({
  readFileSync: vi.fn().mockReturnValue('//>> PLACEHOLDER : runtimeData <<//'),
  readJson: vi.fn(),
  getDirName: vi.fn(() => '/mock/dir'),
  writeTempFile: vi.fn().mockReturnValue('/mock/temp/file.js'),
  createViteConfigs: vi.fn(),
  getUserFiles: vi.fn(),
}));

vi.mock('node:fs', () => ({
  ...mocks,
  default: mocks,
}));

vi.mock('#utils', () => ({
  readJson: mocks.readJson,
  getDirName: mocks.getDirName,
  writeTempFile: mocks.writeTempFile,
}));

vi.mock('#utils/config/create-vite-configs.js', () => ({
  createViteConfigs: mocks.createViteConfigs,
}));

vi.mock('#utils/config/get-user-files.js', () => ({
  getUserFiles: mocks.getUserFiles,
}));

describe('get-files Task', () => {
  let mockFs: MockFs;
  const mockConfig = createMockViteConfig();
  const mockGetFilesResult = createMockGetFilesResult();

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
    mockFs = createMockFs();
  });

  describe('Task Definition', () => {
    it('should have correct name', () => {
      expect(GetFilesTask.name).toBe('common:get-files');
    });
  });

  describe('Task Execution', () => {
    it('should load files and create configs successfully', async () => {
      mocks.getUserFiles.mockResolvedValue({
        manifest: mockGetFilesResult.files.manifest,
        userPkgJson: mockGetFilesResult.files.userPkgJson,
      });

      mocks.createViteConfigs.mockReturnValue(mockConfig);

      const result = await GetFilesTask.run(baseOptions, baseContext);

      expect(result.version).toBe(mockGetFilesResult.version);
      expect(result.files).toEqual(mockGetFilesResult.files);

      expect(result.config.ui.dev.mode).toBe('development');
      expect(result.config.ui.dev.server?.port).toBe(3000);
      expect(result.config.ui.build.build?.outDir).toBe('dist');
      expect(result.config.main.dev.mode).toBe('development');
      expect(result.config.main.build.mode).toBe('development');
    });

    it('should throw GetFilesError when package.json is missing', async () => {
      mocks.getUserFiles.mockRejectedValue(new Error('File not found'));

      await expect(GetFilesTask.run(baseOptions, baseContext)).rejects.toThrow(
        new GetFilesError('Failed to load files: File not found', 'FILE_ERROR'),
      );
    });

    it('should throw GetFilesError when package.json is invalid', async () => {
      mocks.getUserFiles.mockRejectedValue(new Error('Invalid JSON'));

      await expect(GetFilesTask.run(baseOptions, baseContext)).rejects.toThrow(
        new GetFilesError('Failed to load files: Invalid JSON', 'FILE_ERROR'),
      );
    });

    it('should throw GetFilesError when manifest is missing required fields', async () => {
      mocks.getUserFiles.mockRejectedValue(
        new Error('Missing required fields'),
      );

      await expect(GetFilesTask.run(baseOptions, baseContext)).rejects.toThrow(
        new GetFilesError(
          'Failed to load files: Missing required fields',
          'FILE_ERROR',
        ),
      );
    });

    it('should throw GetFilesError when config creation fails', async () => {
      mocks.getUserFiles.mockResolvedValue({
        manifest: mockGetFilesResult.files.manifest,
        userPkgJson: mockGetFilesResult.files.userPkgJson,
      });

      mocks.createViteConfigs.mockImplementation(() => {
        throw new Error('Failed to create configs');
      });

      await expect(GetFilesTask.run(baseOptions, baseContext)).rejects.toThrow(
        new GetFilesError('Failed to create configs', 'CONFIG_ERROR'),
      );
    });

    it('should handle production mode config', async () => {
      mocks.getUserFiles.mockResolvedValue({
        manifest: mockGetFilesResult.files.manifest,
        userPkgJson: mockGetFilesResult.files.userPkgJson,
      });

      mocks.createViteConfigs.mockReturnValue({
        ...mockConfig,
        main: {
          ...mockConfig.main,
          build: {
            ...mockConfig.main.build,
            mode: 'production',
          },
        },
      });

      const result = await GetFilesTask.run(
        { ...baseOptions, mode: 'production' },
        baseContext,
      );

      expect(result.config.main.build.mode).toBe('production');
    });
  });
});
