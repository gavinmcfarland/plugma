import type { GetTaskTypeFor, PluginOptions } from '../core/types.js'
import { Logger } from '../utils/log/logger.js'
import { task } from './runner.js'
import { writeFile, readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { createDebugAwareLogger } from '../utils/debug-aware-logger.js'
import { ListrLogLevels } from 'listr2'

/**
 * Custom error class for temporary options operations
 */
export class TempOptionsError extends Error {
	constructor(
		message: string,
		public code: 'WRITE_ERROR' | 'READ_ERROR',
		public cause?: Error | unknown,
	) {
		super(`${message}: ${cause instanceof Error ? cause.message : String(cause)}`)
		this.name = 'TempOptionsError'
		this.stack = cause instanceof Error ? cause.stack : undefined
	}
}

const getTempFilePath = () => join(tmpdir(), 'plugma-options.json')

/**
 * Task that saves plugin options to a temporary file
 */
export const saveOptions = async (options: PluginOptions): Promise<void> => {
	const logger = createDebugAwareLogger(options.debug)

	try {
		logger.log(ListrLogLevels.OUTPUT, 'Saving options to temporary file...')
		const tempPath = getTempFilePath()
		await writeFile(tempPath, JSON.stringify(options, null, 2), 'utf-8')
		logger.log(ListrLogLevels.OUTPUT, `Options saved successfully to: ${tempPath}`)
	} catch (err) {
		throw new TempOptionsError('Failed to save options', 'WRITE_ERROR', err)
	}
}

/**
 * Task that retrieves plugin options from the temporary file
 */
export const loadOptions = async (options: Pick<PluginOptions, 'debug'>, context?: unknown): Promise<PluginOptions> => {
	const logger = createDebugAwareLogger(options.debug)

	try {
		logger.log(ListrLogLevels.OUTPUT, 'Loading options from temporary file...')
		const tempPath = getTempFilePath()
		const content = await readFile(tempPath, 'utf-8')
		const loadedOptions = JSON.parse(content) as PluginOptions
		logger.log(ListrLogLevels.OUTPUT, 'Options loaded successfully')
		return loadedOptions
	} catch (err) {
		throw new TempOptionsError('Failed to load options', 'READ_ERROR', err)
	}
}

export const SaveOptionsTask = task('common:save-options', saveOptions)
export type SaveOptionsTask = GetTaskTypeFor<typeof SaveOptionsTask>

export const LoadOptionsTask = task('common:load-options', loadOptions)
export type LoadOptionsTask = GetTaskTypeFor<typeof LoadOptionsTask>

export default {
	SaveOptionsTask,
	LoadOptionsTask,
}
