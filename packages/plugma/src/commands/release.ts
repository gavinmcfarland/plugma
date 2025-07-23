import { gitRelease, gitStatus, versionUpdate, workflowTemplates } from '../tasks/release/index.js'
import { ReleaseCommandOptions, ReleaseType } from '../utils/create-options.js'
import { Listr, ListrLogger, ListrLogLevels, ListrTask } from 'listr2'
import { DEFAULT_RENDERER_OPTIONS, SILENT_RENDERER_OPTIONS } from '../constants.js'
import { createDebugAwareLogger } from '../utils/debug-aware-logger.js'
import { Timer } from '../utils/timer.js'
import chalk from 'chalk'

interface ReleaseContext {
	status?: any
	updatedTemplates?: boolean
	releaseWorkflowPath?: string
	newTag?: string
	releaseResult?: any
}

/**
 * Creates a task to validate release type/version
 */
const createValidateReleaseTask = <T extends ReleaseContext>(options: ReleaseCommandOptions): ListrTask<T> => ({
	title: 'Validate release options',
	task: async (ctx, task) => {
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

		// Validation completed
	},
})

/**
 * Creates a task to check Git repository status
 */
const createGitStatusTask = <T extends ReleaseContext>(): ListrTask<T> => ({
	title: 'Check Git repository status',
	task: async (ctx, task) => {
		const status = await gitStatus()
		ctx.status = status

		if (!status.isGitRepo) {
			throw new Error('This is not a Git repository. Please initialize a Git repository before proceeding.')
		}
		if (!status.isClean) {
			throw new Error('Working directory has uncommitted changes. Please commit or stash them before proceeding.')
		}

		// Git status check completed
	},
})

/**
 * Creates a task to update workflow templates
 */
const createWorkflowTemplatesTask = <T extends ReleaseContext>(): ListrTask<T> => ({
	title: 'Update workflow templates',
	task: async (ctx, task) => {
		const { templatesChanged, releaseWorkflowPath } = await workflowTemplates()
		ctx.updatedTemplates = templatesChanged
		ctx.releaseWorkflowPath = releaseWorkflowPath

		// Workflow templates updated
	},
})

/**
 * Creates a task to update version in package.json
 */
const createVersionUpdateTask = <T extends ReleaseContext>(options: ReleaseCommandOptions): ListrTask<T> => ({
	title: 'Update plugin version',
	task: async (ctx, task) => {
		const { newTag, previousVersion, newVersion } = await versionUpdate({
			version: options.version,
			type: options.type || 'stable',
		})
		ctx.newTag = newTag

		// Version updated
	},
})

/**
 * Creates a task to stage files
 */
const createStageFilesTask = <T extends ReleaseContext>(): ListrTask<T> => ({
	title: 'Stage files for commit',
	task: async (ctx, task) => {
		const { execSync } = await import('node:child_process')

		const filesToStage = ['package.json']
		if (ctx.updatedTemplates && ctx.releaseWorkflowPath) {
			filesToStage.push(ctx.releaseWorkflowPath)
		}

		for (const file of filesToStage) {
			execSync(`git add ${file}`, { stdio: 'inherit' })
		}

		// Files staged
	},
})

/**
 * Creates a task to create Git release
 */
const createGitReleaseTask = <T extends ReleaseContext>(options: ReleaseCommandOptions): ListrTask<T> => ({
	title: 'Create Git release',
	task: async (ctx, task) => {
		const releaseResult = await gitRelease({
			tag: ctx.newTag!,
			title: options.title,
			notes: options.notes,
		})
		ctx.releaseResult = releaseResult

		if (!releaseResult.built) {
			throw new Error('Release completed but build failed')
		}

		// Git release completed
	},
})

/**
 * Main release command implementation
 * @param options - Release configuration options
 */
export async function release(options: ReleaseCommandOptions): Promise<void> {
	const logger = createDebugAwareLogger(options.debug)
	const timer = new Timer()
	timer.start()

	const tasks = new Listr(
		[
			createValidateReleaseTask<ReleaseContext>(options),
			createGitStatusTask<ReleaseContext>(),
			createWorkflowTemplatesTask<ReleaseContext>(),
			createVersionUpdateTask<ReleaseContext>(options),
			createStageFilesTask<ReleaseContext>(),
			createGitReleaseTask<ReleaseContext>(options),
		],
		{
			concurrent: false,
			...DEFAULT_RENDERER_OPTIONS,
		},
	)

	try {
		const ctx = await tasks.run()

		timer.stop()
		const version = ctx.newTag || 'unknown'
		console.log(
			`\n${chalk.green('✔ Plugin released ' + version + ' successfully in ' + timer.getDuration() + 'ms')}\n`,
		)
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error))
		logger.log(ListrLogLevels.FAILED, err.message)
		process.exit(1)
	}
}
