/**
 * Task that shows the Plugma startup prompt
 */

import type { GetTaskTypeFor, PluginOptions, ResultsOfTask } from '../core/types.js'
import { Logger } from '../utils/log/logger.js'
import chalk from 'chalk'
import { task } from '../tasks/runner.js'
import getFiles, { GetFilesTask } from '../tasks/get-files.js'
import { getUserFiles } from '../utils/config/get-user-files.js'
import { createViteConfigs } from '../utils/config/create-vite-configs.js'
import { readPlugmaPackageJson } from '../utils/fs/read-json.js'

/**
 * Result type for the show-plugma-prompt task
 * This task doesn't return anything meaningful
 */
export interface ShowPlugmaPromptResult {
	shown: boolean
}

/**
 * Task that displays the Plugma startup prompt
 * Used by all commands to show version and status
 */
const showPlugmaPrompt = async (
	options: PluginOptions,
	context: ResultsOfTask<GetFilesTask>,
): Promise<ShowPlugmaPromptResult> => {
	try {
		const log = new Logger({
			debug: options.debug,
			prefix: 'show-plugma-prompt',
		})

		const version = (await readPlugmaPackageJson()).version

		// Match original formatting with chalk
		log.text(
			`${chalk.blue.bold('Plugma')} ${chalk.grey(`v${version}`)} - A modern Figma plugin development toolkit`,
		)

		return { shown: true }
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		throw new Error(`Failed to show Plugma prompt: ${errorMessage}`)
	}
}

export const ShowPlugmaPromptTask = task('common:show-plugma-prompt', showPlugmaPrompt)

export type ShowPlugmaPromptTask = GetTaskTypeFor<typeof ShowPlugmaPromptTask>

export default ShowPlugmaPromptTask
