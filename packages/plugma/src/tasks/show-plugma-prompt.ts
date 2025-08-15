/**
 * Task that shows the Plugma startup prompt
 */

import type { PluginOptions } from '../core/types.js';
import { Logger } from '../utils/log/logger.js';
import chalk from 'chalk';
import { readPlugmaPackageJson } from '../utils/fs/read-json.js';
import { ListrTask } from 'listr2';

/**
 * Result type for the show-plugma-prompt task
 * This task doesn't return anything meaningful
 */
export interface ShowPlugmaPromptResult {
	shown: boolean;
}

/**
 * Task that displays the Plugma startup prompt
 * Used by all commands to show version and status
 */
export const createShowPlugmaPromptTask = <T extends { shown?: boolean }>(options: PluginOptions): ListrTask<T> => {
	return {
		title: 'Show Plugma Prompt',
		task: async (ctx, task) => {
			const log = new Logger({
				debug: options.debug,
				prefix: 'show-plugma-prompt',
			});

			const version = (await readPlugmaPackageJson()).version;
			const DEVELOPING_LOCALLY = process.env.PLUGMA_DEVELOPING_LOCALLY === 'true';

			// Match original formatting with chalk
			log.text(
				`${chalk.blue.bold('Plugma')} ${chalk.grey(`v${version}${DEVELOPING_LOCALLY ? ' [development]' : ''}`)}`,
			);

			ctx.shown = true;
			return ctx;
		},
	};
};

export default createShowPlugmaPromptTask;
