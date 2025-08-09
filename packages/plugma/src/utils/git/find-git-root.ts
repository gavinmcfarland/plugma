/**
 * Utility to find the git repository root directory
 * This is needed for monorepo support where the plugin might not be at the repo root
 */

import { execSync } from 'node:child_process';
import path from 'node:path';

/**
 * Custom error class for Git repository errors
 */
export class GitRootError extends Error {
	constructor(
		message: string,
		public code: 'NOT_GIT_REPO' | 'GIT_ERROR',
	) {
		super(message);
		this.name = 'GitRootError';
	}
}

/**
 * Finds the root directory of the git repository
 *
 * @param startPath - The directory to start searching from (defaults to current working directory)
 * @returns The absolute path to the git repository root
 * @throws {GitRootError} If not in a git repository or if git command fails
 */
export function findGitRoot(startPath?: string): string {
	const cwd = startPath || process.cwd();

	try {
		// Use git to find the repository root
		const gitRootResult = execSync('git rev-parse --show-toplevel', {
			cwd,
			encoding: 'utf8',
			stdio: 'pipe',
		});

		// Convert to string and trim
		const gitRoot = String(gitRootResult).trim();

		return path.resolve(gitRoot);
	} catch (err) {
		// Check if the error indicates this is not a git repository
		if (err instanceof Error && err.message.includes('not a git repository')) {
			throw new GitRootError('This is not a Git repository. Cannot find repository root.', 'NOT_GIT_REPO');
		}

		// For any other git errors
		throw new GitRootError(
			`Git error while finding repository root: ${err instanceof Error ? err.message : 'Unknown error'}`,
			'GIT_ERROR',
		);
	}
}

/**
 * Gets the relative path from git root to the current working directory
 *
 * @param startPath - The directory to calculate relative path from (defaults to current working directory)
 * @returns The relative path from git root to the given directory
 * @throws {GitRootError} If not in a git repository or if git command fails
 */
export function getRelativePathFromGitRoot(startPath?: string): string {
	const cwd = startPath || process.cwd();
	const gitRoot = findGitRoot(cwd);

	return path.relative(gitRoot, cwd);
}

/**
 * Checks if the current directory is at the git repository root
 *
 * @param startPath - The directory to check (defaults to current working directory)
 * @returns True if the directory is the git repository root
 */
export function isAtGitRoot(startPath?: string): boolean {
	try {
		const relativePath = getRelativePathFromGitRoot(startPath);
		return relativePath === '';
	} catch {
		return false;
	}
}
