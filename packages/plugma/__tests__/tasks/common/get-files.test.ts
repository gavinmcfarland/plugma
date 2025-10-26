import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GetFilesError, GetFilesTask } from '#tasks';
import {
  type MockFs,
  createMockFs,
  createMockGetFilesResult,
  createMockViteConfig,
} from '#test';

const mocks = vi.hoisted(() => ({
  readFileSync: vi.fn().mockReturnValue('/*--[ RUNTIME_DATA ]--*/'),
  readJson: vi.fn(),
  readPlugmaPackageJson: vi.fn(),
  getDirName: vi.fn(() => '/mock/dir'),
  writeTempFile: vi.fn().mockReturnValue('/mock/temp/file.js'),
  createViteConfigs: vi.fn(),
  getUserFiles: vi.fn(),
  promises: {
    readFile: vi.fn().mockResolvedValue('{"name": "test"}'),
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
    rm: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('node:fs', () => ({
  ...mocks,
  default: mocks,
  promises: mocks.promises,
}));

vi.mock('#utils', () => ({
  readJson: mocks.readJson,
  getDirName: mocks.getDirName,
  writeTempFile: mocks.writeTempFile,
}));

vi.mock('#shared/utils/fs/read-json.js', () => ({
  readJson: mocks.readJson,
  readModule: vi.fn().mockResolvedValue(null),
  readPlugmaPackageJson: mocks.readPlugmaPackageJson,
}));

vi.mock('#utils/config/create-vite-configs.js', () => ({
  createViteConfigs: mocks.createViteConfigs,
}));

vi.mock('#shared/utils/get-user-files.js', () => ({
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
    cwd: '/mock/test/dir',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs = createMockFs();
    mocks.readJson.mockImplementation(async (filePath: string) => {
      if (filePath.endsWith('package.json')) {
        // Return Plugma package.json if the path contains 'packages/plugma/package.json'
        // The path from readPlugmaPackageJson would be: .../packages/plugma/package.json
        if (filePath.includes('packages/plugma/package.json')) {
          return mockGetFilesResult.plugmaPkg;
        }
        // Otherwise return user's package.json
        return mockGetFilesResult.files.userPkgJson;
      }
      throw new Error('File not found');
    });
    mocks.readPlugmaPackageJson.mockResolvedValue(mockGetFilesResult.plugmaPkg);
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
        rawManifest: mockGetFilesResult.files.rawManifest,
      });

      mocks.createViteConfigs.mockReturnValue(mockConfig);

      const result = await GetFilesTask.run(baseOptions);

      expect(result.plugmaPkg.version).toBe(
        mockGetFilesResult.plugmaPkg.version,
      );
      expect(result.files).toEqual(mockGetFilesResult.files);

      expect(result.config.ui.dev.mode).toBe('development');
      expect(result.config.ui.dev.server?.port).toBe(3000);
      expect(result.config.ui.build.build?.outDir).toBe('dist');
      expect(result.config.main.dev.mode).toBe('development');
      expect(result.config.main.build.mode).toBe('development');
    });

    it('should throw GetFilesError when package.json is missing', async () => {
      const error = new Error('File not found');
      mocks.getUserFiles.mockRejectedValue(error);

      await expect(GetFilesTask.run(baseOptions)).rejects.toThrow(
        new GetFilesError('Failed to load files', 'FILE_ERROR', error),
      );
    });

    it('should throw GetFilesError when package.json is invalid', async () => {
      const error = new Error('Invalid JSON format');
      mocks.getUserFiles.mockRejectedValue(error);

      await expect(GetFilesTask.run(baseOptions)).rejects.toThrow(
        new GetFilesError('Failed to load files', 'FILE_ERROR', error),
      );
    });

    it('should throw GetFilesError when manifest is missing required fields', async () => {
      const error = new Error('Missing required fields');
      mocks.getUserFiles.mockRejectedValue(error);

      await expect(GetFilesTask.run(baseOptions)).rejects.toThrow(
        new GetFilesError('Failed to load files', 'FILE_ERROR', error),
      );
    });

    it('should throw GetFilesError when config creation fails', async () => {
      mocks.getUserFiles.mockResolvedValue({
        manifest: mockGetFilesResult.files.manifest,
        userPkgJson: mockGetFilesResult.files.userPkgJson,
        rawManifest: mockGetFilesResult.files.rawManifest,
      });

      const error = new Error('Failed to create configs');
      mocks.createViteConfigs.mockImplementation(() => {
        throw error;
      });

      await expect(GetFilesTask.run(baseOptions)).rejects.toThrow(
        new GetFilesError('Failed to create configs', 'CONFIG_ERROR', error),
      );
    });

    it('should handle production mode config', async () => {
      mocks.getUserFiles.mockResolvedValue({
        manifest: mockGetFilesResult.files.manifest,
        userPkgJson: mockGetFilesResult.files.userPkgJson,
        rawManifest: mockGetFilesResult.files.rawManifest,
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

      const result = await GetFilesTask.run({
        ...baseOptions,
        mode: 'production',
      });

      expect(result.config.main.build.mode).toBe('production');
    });
  });
});
