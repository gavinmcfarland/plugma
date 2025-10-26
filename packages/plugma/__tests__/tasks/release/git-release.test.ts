import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GitReleaseError, gitRelease } from '../../../src/tasks/release/push-to-github.js';

// Mock child_process.execSync
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

// Import after mocking
import { execSync } from 'node:child_process';

describe('gitRelease', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should create release with commit and tag', async () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));

    const result = await gitRelease({
      tag: 'v1',
    });

    expect(result).toEqual({
      committed: true,
      tagged: true,
      pushed: true,
      built: true,
      tag: 'v1',
    });

    expect(execSync).toHaveBeenCalledWith('git add .', { stdio: 'ignore' });
    expect(execSync).toHaveBeenCalledWith(
      'git commit -m "Plugin version updated"',
      {
        stdio: 'ignore',
      },
    );
    expect(execSync).toHaveBeenCalledWith('git tag v1', { stdio: 'ignore' });
    expect(execSync).toHaveBeenCalledWith('git push', { stdio: 'ignore' });
    expect(execSync).toHaveBeenCalledWith('git push origin v1', {
      stdio: 'ignore',
    });
    expect(execSync).toHaveBeenCalledWith('plugma build', { stdio: 'pipe' });
  });

  it('should create release with title and notes', async () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));

    const result = await gitRelease({
      tag: 'v1',
      title: 'Release Title',
      notes: 'Release Notes',
    });

    expect(result).toEqual({
      committed: true,
      tagged: true,
      pushed: true,
      built: true,
      tag: 'v1',
    });

    expect(execSync).toHaveBeenCalledWith(
      'git tag v1 -m "TITLE: Release Title\n\nNOTES: Release Notes"',
      { stdio: 'ignore' },
    );
  });

  it('should handle commit failure', async () => {
    vi.mocked(execSync).mockImplementationOnce(() => {
      throw new Error('commit error');
    });

    await expect(gitRelease({ tag: 'v1' })).rejects.toThrow(
      new GitReleaseError(
        'Failed to stage changes: commit error',
        'COMMIT_ERROR',
      ),
    );

    expect(execSync).toHaveBeenCalledTimes(1);
  });

  it('should handle tag failure', async () => {
    vi.mocked(execSync)
      .mockReturnValueOnce(Buffer.from('')) // git add
      .mockReturnValueOnce(Buffer.from('')) // git commit
      .mockImplementationOnce(() => {
        throw new Error('tag error');
      }); // git tag

    await expect(gitRelease({ tag: 'v1' })).rejects.toThrow(
      new GitReleaseError('Failed to create tag: tag error', 'TAG_ERROR'),
    );

    // Should attempt rollback
    expect(execSync).toHaveBeenCalledWith('git reset --hard HEAD^', {
      stdio: 'ignore',
    });
  });

  it('should handle push failure and rollback', async () => {
    vi.mocked(execSync)
      .mockReturnValueOnce(Buffer.from('')) // git add
      .mockReturnValueOnce(Buffer.from('')) // git commit
      .mockReturnValueOnce(Buffer.from('')) // git tag
      .mockImplementationOnce(() => {
        throw new Error('push error');
      }); // git push

    await expect(gitRelease({ tag: 'v1' })).rejects.toThrow(
      new GitReleaseError('Failed to push changes: push error', 'PUSH_ERROR'),
    );

    // Should attempt rollback
    expect(execSync).toHaveBeenCalledWith('git reset --hard HEAD^', {
      stdio: 'ignore',
    });
    expect(execSync).toHaveBeenCalledWith('git tag -d v1', { stdio: 'ignore' });
  });

  it('should handle build failure', async () => {
    vi.mocked(execSync)
      .mockReturnValueOnce(Buffer.from('')) // git add
      .mockReturnValueOnce(Buffer.from('')) // git commit
      .mockReturnValueOnce(Buffer.from('')) // git tag
      .mockReturnValueOnce(Buffer.from('')) // git push
      .mockReturnValueOnce(Buffer.from('')) // git push tag
      .mockImplementationOnce(() => {
        throw new Error('build error');
      }); // plugma build

    await expect(gitRelease({ tag: 'v1' })).rejects.toThrow(
      new GitReleaseError(
        'Build failed after release: build error',
        'BUILD_ERROR',
      ),
    );

    // Should not rollback since push was successful
    expect(execSync).not.toHaveBeenCalledWith('git reset --hard HEAD^', {
      stdio: 'ignore',
    });
  });

  it('should handle rollback failure', async () => {
    vi.mocked(execSync)
      .mockImplementationOnce(() => Buffer.from('')) // add
      .mockImplementationOnce(() => Buffer.from('')) // commit
      .mockImplementationOnce(() => Buffer.from('')) // tag
      .mockImplementationOnce(() => {
        throw new Error('push error');
      }) // push
      .mockImplementationOnce(() => {
        throw new Error('rollback error');
      }); // rollback

    await expect(gitRelease({ tag: 'v1' })).rejects.toThrow(
      new GitReleaseError(
        'Failed to rollback changes after error: rollback error. Original error: Failed to push changes: push error',
        'ROLLBACK_ERROR',
      ),
    );
  });
});
