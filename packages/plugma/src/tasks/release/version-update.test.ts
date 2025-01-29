import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  VersionUpdateError,
  type VersionUpdateOptions,
  versionUpdate,
} from './version-update.js';

// Mock fs promises
vi.mock('node:fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));

// Import after mocking
import { promises as fs } from 'node:fs';

describe('versionUpdate', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const mockPackageJson = (pluginVersion?: string) => {
    const pkg = { plugma: pluginVersion ? { pluginVersion } : {} };
    vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(pkg));
    return pkg;
  };

  it('should initialize new plugin version', async () => {
    mockPackageJson();
    vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

    const result = await versionUpdate();

    expect(result).toEqual({
      previousVersion: '0',
      newVersion: '1',
      wasInitialized: true,
      releaseType: 'stable',
    });

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('package.json'),
      expect.stringContaining('"pluginVersion":"1"'),
      'utf8',
    );
  });

  it('should handle manual version override', async () => {
    mockPackageJson('1');
    vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

    const options: VersionUpdateOptions = {
      version: '42',
    };

    const result = await versionUpdate(options);

    expect(result).toEqual({
      previousVersion: '1',
      newVersion: '42',
      wasInitialized: false,
      releaseType: 'stable',
    });
  });

  it('should reject invalid manual versions', async () => {
    mockPackageJson('1');

    const options: VersionUpdateOptions = {
      version: 'invalid',
    };

    await expect(versionUpdate(options)).rejects.toThrow(
      new VersionUpdateError(
        'Invalid version format. Version must be a whole number or number with alpha/beta suffix (e.g. "1", "42", "1-alpha.0", "42-beta.5")',
        'INVALID_VERSION',
      ),
    );
  });

  it('should increment stable version', async () => {
    mockPackageJson('1');
    vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

    const result = await versionUpdate({ type: 'stable' });

    expect(result).toEqual({
      previousVersion: '1',
      newVersion: '2',
      wasInitialized: false,
      releaseType: 'stable',
    });
  });

  it('should handle alpha releases', async () => {
    mockPackageJson('1');
    vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

    const result = await versionUpdate({ type: 'alpha' });

    expect(result).toEqual({
      previousVersion: '1',
      newVersion: '1-alpha.0',
      wasInitialized: false,
      releaseType: 'alpha',
    });
  });

  it('should increment alpha subversion', async () => {
    mockPackageJson('1-alpha.0');
    vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

    const result = await versionUpdate({ type: 'alpha' });

    expect(result).toEqual({
      previousVersion: '1-alpha.0',
      newVersion: '1-alpha.1',
      wasInitialized: false,
      releaseType: 'alpha',
    });
  });

  it('should handle beta releases', async () => {
    mockPackageJson('1');
    vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

    const result = await versionUpdate({ type: 'beta' });

    expect(result).toEqual({
      previousVersion: '1',
      newVersion: '1-beta.0',
      wasInitialized: false,
      releaseType: 'beta',
    });
  });

  it('should increment beta subversion', async () => {
    mockPackageJson('1-beta.0');
    vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

    const result = await versionUpdate({ type: 'beta' });

    expect(result).toEqual({
      previousVersion: '1-beta.0',
      newVersion: '1-beta.1',
      wasInitialized: false,
      releaseType: 'beta',
    });
  });

  it('should switch from alpha to beta', async () => {
    mockPackageJson('1-alpha.1');
    vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

    const result = await versionUpdate({ type: 'beta' });

    expect(result).toEqual({
      previousVersion: '1-alpha.1',
      newVersion: '1-beta.0',
      wasInitialized: false,
      releaseType: 'beta',
    });
  });

  it('should handle invalid package.json', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce('invalid json');

    await expect(versionUpdate()).rejects.toThrow(
      new VersionUpdateError(
        expect.stringContaining('Invalid package.json:'),
        'PARSE_ERROR',
      ),
    );
  });

  it('should handle file system errors', async () => {
    vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('file error'));

    await expect(versionUpdate()).rejects.toThrow(
      new VersionUpdateError(
        'Failed to update version: file error',
        'FILE_ERROR',
      ),
    );
  });

  it('should handle write errors', async () => {
    mockPackageJson('1');
    vi.mocked(fs.writeFile).mockRejectedValueOnce(new Error('write error'));

    await expect(versionUpdate()).rejects.toThrow(
      new VersionUpdateError(
        'Failed to update version: write error',
        'FILE_ERROR',
      ),
    );
  });
});
