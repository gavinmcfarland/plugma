import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GitStatusError, gitStatus } from './git-status.js';

// Mock child_process.execSync
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

// Import after mocking
import { execSync } from 'node:child_process';

describe('gitStatus', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should detect a clean git repository', async () => {
    vi.mocked(execSync)
      // First call - check if git repo
      .mockReturnValueOnce(Buffer.from(''))
      // Second call - check uncommitted changes
      .mockReturnValueOnce(Buffer.from(''))
      // Third call - check staged changes
      .mockReturnValueOnce(Buffer.from(''));

    const result = await gitStatus();

    expect(result).toEqual({
      isClean: true,
      isGitRepo: true,
      uncommittedFiles: [],
      stagedFiles: [],
    });

    expect(execSync).toHaveBeenCalledTimes(3);
    expect(execSync).toHaveBeenNthCalledWith(
      1,
      'git rev-parse --is-inside-work-tree',
      { stdio: 'ignore' },
    );
    expect(execSync).toHaveBeenNthCalledWith(2, 'git diff --name-only', {
      encoding: 'utf8',
    });
    expect(execSync).toHaveBeenNthCalledWith(
      3,
      'git diff --name-only --cached',
      {
        encoding: 'utf8',
      },
    );
  });

  it('should throw GitStatusError for uncommitted changes', async () => {
    vi.mocked(execSync)
      .mockReturnValueOnce(Buffer.from('')) // is git repo
      .mockReturnValueOnce(Buffer.from('modified-file.txt\nother-file.txt')) // uncommitted changes
      .mockReturnValueOnce(Buffer.from('')); // no staged changes

    await expect(gitStatus()).rejects.toThrow(
      new GitStatusError(
        'Working directory has 2 uncommitted files. Please commit or stash them before proceeding.',
        'UNCOMMITTED_CHANGES',
      ),
    );
  });

  it('should throw GitStatusError for staged changes', async () => {
    vi.mocked(execSync)
      .mockReturnValueOnce(Buffer.from('')) // is git repo
      .mockReturnValueOnce(Buffer.from('')) // no uncommitted changes
      .mockReturnValueOnce(Buffer.from('staged-file.txt')); // staged changes

    await expect(gitStatus()).rejects.toThrow(
      new GitStatusError(
        'Working directory has 1 staged files. Please commit or stash them before proceeding.',
        'UNCOMMITTED_CHANGES',
      ),
    );
  });

  it('should throw GitStatusError for both uncommitted and staged changes', async () => {
    vi.mocked(execSync)
      .mockReturnValueOnce(Buffer.from('')) // is git repo
      .mockReturnValueOnce(Buffer.from('modified.txt')) // uncommitted changes
      .mockReturnValueOnce(Buffer.from('staged.txt')); // staged changes

    await expect(gitStatus()).rejects.toThrow(
      new GitStatusError(
        'Working directory has 1 uncommitted files and 1 staged files. Please commit or stash them before proceeding.',
        'UNCOMMITTED_CHANGES',
      ),
    );
  });

  it('should throw GitStatusError for non-git repository', async () => {
    vi.mocked(execSync).mockImplementationOnce(() => {
      const error = new Error('fatal: not a git repository');
      throw error;
    });

    await expect(gitStatus()).rejects.toThrow(
      new GitStatusError(
        'This is not a Git repository. Please initialize a Git repository before proceeding.',
        'NOT_GIT_REPO',
      ),
    );

    expect(execSync).toHaveBeenCalledTimes(1);
  });

  it('should throw GitStatusError for other git errors', async () => {
    vi.mocked(execSync).mockImplementationOnce(() => {
      throw new Error('Some other git error');
    });

    await expect(gitStatus()).rejects.toThrow(
      new GitStatusError('Git error: Some other git error', 'GIT_ERROR'),
    );
  });
});
