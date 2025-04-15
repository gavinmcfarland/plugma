import type { GetTaskTypeFor, PluginOptions } from '../core/types.js'
import { Logger } from '../utils/log/logger.js'
import { mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { task } from './runner.js'

interface Result {
	outputPath: string
}

// FIXME: Can't clean the directory because this causes an issue between builds when the plugin window is open because Figma warns of missing files. Suggestion is to move this responsibility to build:manifest task.

/**
 * Task that ensures the dist directory exists and is empty.
 * This task should run before any other build tasks to provide a clean slate.
 *
 * @param options - Plugin options containing output directory configuration
 * @returns The path to the created output directory
 */
const ensureDist = async (options: PluginOptions): Promise<Result> => {
	const logger = new Logger({
		debug: options.debug,
		prefix: 'common:ensure-dist',
	})
	const outputPath = resolve(process.cwd(), options.output || 'dist')

	try {
		logger.debug(`Ensuring clean dist directory at ${outputPath}`)

		// Remove existing directory and its contents if it exists
		// await rm(outputPath, { recursive: true, force: true })

		// Create fresh directory with proper permissions
		await mkdir(outputPath, { recursive: true, mode: 0o755 })

		logger.debug('Dist directory prepared successfully')

		return { outputPath }
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		throw new Error(`Failed to prepare dist directory: ${errorMessage}`)
	}
}

export const EnsureDistTask = task('common:ensure-dist', ensureDist)
export type EnsureDistTask = GetTaskTypeFor<typeof EnsureDistTask>

export default EnsureDistTask
