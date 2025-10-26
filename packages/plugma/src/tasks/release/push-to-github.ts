/**
 * Task to handle Git release operations
 * Creates commits, tags, and pushes changes to remote
 */

import { execSync } from 'node:child_process'

/**
 * Custom error class for Git release operations
 */
export class GitReleaseError extends Error {
	constructor(
		message: string,
		public code: 'COMMIT_ERROR' | 'TAG_ERROR' | 'PUSH_ERROR' | 'BUILD_ERROR' | 'ROLLBACK_ERROR',
	) {
		super(message)
		this.name = 'GitReleaseError'
	}
}

/**
 * Options for Git release
 */
export interface GitReleaseOptions {
	/** Release title */
	title?: string
	/** Release notes */
	notes?: string
	/** Version tag (e.g. "v1", "v2-alpha.0") */
	tag: string
}

/**
 * Result of Git release operation
 */
export interface GitReleaseResult {
	/** Whether changes were committed */
	committed: boolean
	/** Whether tag was created */
	tagged: boolean
	/** Whether changes were pushed */
	pushed: boolean
	/** Whether build was successful */
	built: boolean
	/** Tag that was created */
	tag: string
}

/**
 * Executes a Git command and handles errors
 */
function execGitCommand(command: string, errorCode: GitReleaseError['code'], errorMessage: string): void {
	try {
		execSync(command, { stdio: 'ignore' })
	} catch (err) {
		throw new GitReleaseError(`${errorMessage}: ${err instanceof Error ? err.message : 'Unknown error'}`, errorCode)
	}
}

/**
 * Creates Git release with commit, tag, and push
 * Handles rollback on failure
 *
 * @throws {GitReleaseError} If release operations fail
 */
export async function gitRelease(options: GitReleaseOptions): Promise<GitReleaseResult> {
	const result: GitReleaseResult = {
		committed: false,
		tagged: false,
		pushed: false,
		built: false,
		tag: options.tag,
	}

	try {
		// Stage and commit changes
		execGitCommand('git add .', 'COMMIT_ERROR', 'Failed to stage changes')
		execGitCommand('git commit -m "Plugin version updated"', 'COMMIT_ERROR', 'Failed to commit changes')
		result.committed = true

		// Build tag message
		let tagMessage = ''
		if (options.title) {
			tagMessage += `TITLE: ${options.title}`
		}
		if (options.notes) {
			if (tagMessage) {
				tagMessage += '\n\n'
			}
			tagMessage += `NOTES: ${options.notes}`
		}

		// Create tag
		const tagCommand = tagMessage ? `git tag ${options.tag} -m "${tagMessage}"` : `git tag ${options.tag}`

		execGitCommand(tagCommand, 'TAG_ERROR', 'Failed to create tag')
		result.tagged = true

		// Push changes and tag
		execGitCommand('git push', 'PUSH_ERROR', 'Failed to push changes')
		execGitCommand(`git push origin ${options.tag}`, 'PUSH_ERROR', 'Failed to push tag')
		result.pushed = true

		// Run build after successful push
		try {
			// Use 'pipe' instead of 'inherit' to suppress the build output
			// since it's already shown in the release task list
			execSync('plugma build', { stdio: 'pipe' })
			result.built = true
		} catch (err) {
			throw new GitReleaseError(
				`Build failed after release: ${err instanceof Error ? err.message : 'Unknown error'}`,
				'BUILD_ERROR',
			)
		}

		return result
	} catch (err) {
		// If it's not our error type, wrap it
		const error =
			err instanceof GitReleaseError
				? err
				: new GitReleaseError(
						`Release failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
						'COMMIT_ERROR',
					)

		// Only rollback if we committed but failed to push
		if (result.committed && !result.pushed) {
			try {
				// Reset to previous commit
				execSync('git reset --hard HEAD^', { stdio: 'ignore' })
				// Delete tag if it was created
				if (result.tagged) {
					execSync(`git tag -d ${options.tag}`, { stdio: 'ignore' })
				}
			} catch (rollbackErr) {
				throw new GitReleaseError(
					`Failed to rollback changes after error: ${
						rollbackErr instanceof Error ? rollbackErr.message : 'Unknown error'
					}. Original error: ${error.message}`,
					'ROLLBACK_ERROR',
				)
			}
		}

		throw error
	}
}
