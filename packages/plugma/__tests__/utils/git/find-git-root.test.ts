import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GitRootError, findGitRoot, getRelativePathFromGitRoot, isAtGitRoot } from '../../../src/utils/git/find-git-root.js';

// Mock node modules
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'node:child_process';

describe('Git Root Utilities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.clearAllMocks();
  });

  describe('findGitRoot', () => {
    it('should return git repository root path', () => {
      const mockGitRoot = '/path/to/repo';
      vi.mocked(execSync).mockReturnValue(Buffer.from(`${mockGitRoot}\n`));

      const result = findGitRoot();

      expect(result).toBe(mockGitRoot);
      expect(execSync).toHaveBeenCalledWith('git rev-parse --show-toplevel', {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe'
      });
    });

    it('should use provided start path', () => {
      const mockGitRoot = '/path/to/repo';
      const startPath = '/some/start/path';
      vi.mocked(execSync).mockReturnValue(Buffer.from(`${mockGitRoot}\n`));

      const result = findGitRoot(startPath);

      expect(result).toBe(mockGitRoot);
      expect(execSync).toHaveBeenCalledWith('git rev-parse --show-toplevel', {
        cwd: startPath,
        encoding: 'utf8',
        stdio: 'pipe'
      });
    });

    it('should throw GitRootError when not in a git repository', () => {
      const error = new Error('fatal: not a git repository (or any of the parent directories): .git');
      vi.mocked(execSync).mockImplementation(() => {
        throw error;
      });

      expect(() => findGitRoot()).toThrow(
        new GitRootError(
          'This is not a Git repository. Cannot find repository root.',
          'NOT_GIT_REPO'
        )
      );
    });

    it('should throw GitRootError for other git errors', () => {
      const error = new Error('some other git error');
      vi.mocked(execSync).mockImplementation(() => {
        throw error;
      });

      expect(() => findGitRoot()).toThrow(
        new GitRootError(
          'Git error while finding repository root: some other git error',
          'GIT_ERROR'
        )
      );
    });

    it('should handle unknown errors', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw 'string error';
      });

      expect(() => findGitRoot()).toThrow(
        new GitRootError(
          'Git error while finding repository root: Unknown error',
          'GIT_ERROR'
        )
      );
    });
  });

  describe('getRelativePathFromGitRoot', () => {
    it('should return relative path from git root to current directory', () => {
      const mockGitRoot = '/path/to/repo';
      const currentDir = '/path/to/repo/packages/plugin';
      const expectedRelativePath = 'packages/plugin';

      vi.mocked(execSync).mockReturnValue(Buffer.from(`${mockGitRoot}\n`));

      // Mock process.cwd to return the current directory
      const originalCwd = process.cwd;
      process.cwd = vi.fn().mockReturnValue(currentDir);

      const result = getRelativePathFromGitRoot();

      expect(result).toBe(expectedRelativePath);

      // Restore original cwd
      process.cwd = originalCwd;
    });

    it('should return empty string when at git root', () => {
      const mockGitRoot = '/path/to/repo';

      vi.mocked(execSync).mockReturnValue(Buffer.from(`${mockGitRoot}\n`));

      // Mock process.cwd to return the git root
      const originalCwd = process.cwd;
      process.cwd = vi.fn().mockReturnValue(mockGitRoot);

      const result = getRelativePathFromGitRoot();

      expect(result).toBe('');

      // Restore original cwd
      process.cwd = originalCwd;
    });

    it('should use provided start path', () => {
      const mockGitRoot = '/path/to/repo';
      const startPath = '/path/to/repo/some/subdir';
      const expectedRelativePath = 'some/subdir';

      vi.mocked(execSync).mockReturnValue(Buffer.from(`${mockGitRoot}\n`));

      const result = getRelativePathFromGitRoot(startPath);

      expect(result).toBe(expectedRelativePath);
    });

    it('should throw GitRootError when git root detection fails', () => {
      const error = new Error('not a git repository');
      vi.mocked(execSync).mockImplementation(() => {
        throw error;
      });

      expect(() => getRelativePathFromGitRoot()).toThrow(GitRootError);
    });
  });

  describe('isAtGitRoot', () => {
    it('should return true when at git root', () => {
      const mockGitRoot = '/path/to/repo';

      vi.mocked(execSync).mockReturnValue(Buffer.from(`${mockGitRoot}\n`));

      // Mock process.cwd to return the git root
      const originalCwd = process.cwd;
      process.cwd = vi.fn().mockReturnValue(mockGitRoot);

      const result = isAtGitRoot();

      expect(result).toBe(true);

      // Restore original cwd
      process.cwd = originalCwd;
    });

    it('should return false when not at git root', () => {
      const mockGitRoot = '/path/to/repo';
      const currentDir = '/path/to/repo/packages/plugin';

      vi.mocked(execSync).mockReturnValue(Buffer.from(`${mockGitRoot}\n`));

      // Mock process.cwd to return a subdirectory
      const originalCwd = process.cwd;
      process.cwd = vi.fn().mockReturnValue(currentDir);

      const result = isAtGitRoot();

      expect(result).toBe(false);

      // Restore original cwd
      process.cwd = originalCwd;
    });

    it('should return false when git operations fail', () => {
      const error = new Error('not a git repository');
      vi.mocked(execSync).mockImplementation(() => {
        throw error;
      });

      const result = isAtGitRoot();

      expect(result).toBe(false);
    });

    it('should use provided start path', () => {
      const mockGitRoot = '/path/to/repo';
      const startPath = '/path/to/repo/some/subdir';

      vi.mocked(execSync).mockReturnValue(Buffer.from(`${mockGitRoot}\n`));

      const result = isAtGitRoot(startPath);

      expect(result).toBe(false);
    });
  });
});
