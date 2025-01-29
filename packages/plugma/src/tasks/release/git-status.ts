/**
 * Task to validate Git repository status before release
 * Checks for uncommitted changes and validates repository state
 */

import { execSync } from 'node:child_process';

/**
 * Custom error class for Git status validation errors
 */
export class GitStatusError extends Error {
  constructor(
    message: string,
    public code: 'NOT_GIT_REPO' | 'UNCOMMITTED_CHANGES' | 'GIT_ERROR',
  ) {
    super(message);
    this.name = 'GitStatusError';
  }
}

/**
 * Git status validation result
 */
export interface GitStatusResult {
  /** Whether the repository is clean (no uncommitted changes) */
  isClean: boolean;
  /** Whether the current directory is a Git repository */
  isGitRepo: boolean;
  /** List of uncommitted files, if any */
  uncommittedFiles?: string[];
  /** List of staged files, if any */
  stagedFiles?: string[];
}

/**
 * Validates Git repository status
 * Checks for uncommitted changes and validates repository state
 *
 * @throws {GitStatusError} If the directory is not a Git repository or has uncommitted changes
 */
export async function gitStatus(): Promise<GitStatusResult> {
  try {
    // Check if current directory is a Git repository
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });

    // Check for uncommitted changes
    const uncommittedFiles = execSync('git diff --name-only', {
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    const stagedFiles = execSync('git diff --name-only --cached', {
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    const isClean = uncommittedFiles.length === 0 && stagedFiles.length === 0;

    if (!isClean) {
      const details = [
        uncommittedFiles.length > 0
          ? `${uncommittedFiles.length} uncommitted files`
          : '',
        stagedFiles.length > 0 ? `${stagedFiles.length} staged files` : '',
      ]
        .filter(Boolean)
        .join(' and ');

      throw new GitStatusError(
        `Working directory has ${details}. Please commit or stash them before proceeding.`,
        'UNCOMMITTED_CHANGES',
      );
    }

    return {
      isClean: true,
      isGitRepo: true,
      uncommittedFiles: [],
      stagedFiles: [],
    };
  } catch (err) {
    // If it's already our custom error, rethrow it
    if (err instanceof GitStatusError) {
      throw err;
    }

    // Check if the error indicates this is not a git repository
    if (err instanceof Error && err.message.includes('not a git repository')) {
      throw new GitStatusError(
        'This is not a Git repository. Please initialize a Git repository before proceeding.',
        'NOT_GIT_REPO',
      );
    }

    // For any other git errors
    throw new GitStatusError(
      `Git error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      'GIT_ERROR',
    );
  }
}
