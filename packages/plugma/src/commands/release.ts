import { gitRelease, gitStatus, versionUpdate, workflowTemplates } from '../tasks/release/index.js'
import { ReleaseCommandOptions, ReleaseType } from '../utils/create-options.js'

/**
 * Main release command implementation
 * @param options - Release configuration options
 */
export async function release(options: ReleaseCommandOptions): Promise<void> {
	// Validate release type/version
	if (options.type && ['alpha', 'beta', 'stable'].includes(options.type)) {
		options.type = options.type as ReleaseType
	} else if (options.type && /^\d+$/.test(options.type)) {
		// If type is a number, treat it as version
		options.version = options.type
		options.type = 'stable'
	} else if (options.version && /^\d+$/.test(options.version)) {
		// Version is already validated in options
	} else {
		throw new Error('Invalid version: must be a whole integer or a release type (alpha, beta, stable)')
	}

	// Check Git repository status
	const status = await gitStatus()

	if (!status.isGitRepo) {
		throw new Error('This is not a Git repository. Please initialize a Git repository before proceeding.')
	}
	if (!status.isClean) {
		throw new Error('Working directory has uncommitted changes. Please commit or stash them before proceeding.')
	}

	// Update workflow templates
	const { updatedTemplates, releaseWorkflowPath } = await workflowTemplates()

	// Update version in package.json
	const { newTag } = await versionUpdate({
		version: options.version,
		type: options.type || 'stable',
	})

	// Commit changes and create release
	const filesToStage = ['package.json']
	if (updatedTemplates) {
		filesToStage.push(releaseWorkflowPath)
	}

	// Stage files before creating release
	const { execSync } = await import('node:child_process')
	for (const file of filesToStage) {
		execSync(`git add ${file}`, { stdio: 'inherit' })
	}

	const releaseResult = await gitRelease({
		tag: newTag,
		title: options.title,
		notes: options.notes,
	})

	// Build is already handled inside gitRelease function
	if (!releaseResult.built) {
		throw new Error('Release completed but build failed')
	}

	// TODO: review this...
	// CreateReleaseYmlTask.run(options as any);
}
