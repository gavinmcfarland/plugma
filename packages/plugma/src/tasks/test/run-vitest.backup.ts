/**
 * Task to configure and run Vitest for plugin testing
 * Handles test discovery, execution, and reporting
 */

import type { PluginOptions } from '../../core/types.js';
import { createViteConfigs } from '../../utils/config/create-vite-configs.js';
import { getUserFiles } from '../../utils/get-user-files.js';
import { Logger } from '../../utils/log/logger.js';
import { replacePlugmaTesting } from '../../vite-plugins/replace-testing-import-path.js';
import { startVitest } from 'vitest/node';

/**
 * Result type for the runVitest task
 */
export interface RunVitestResult {
	/** Whether all tests passed */
	success: boolean;
}

/**
 * Task that configures and runs Vitest in the user's plugin project
 */
export const runVitest = async (options: PluginOptions): Promise<RunVitestResult> => {
	const log = new Logger({ debug: options.debug });

	try {
		log.info('Loading plugin configuration...');
		const files = await getUserFiles(options);
		const configs = createViteConfigs(options, files);

		// Add our test plugin to the Vite config
		const testConfig = {
			...configs.main,
			plugins: [...(configs.main.dev.plugins || []), replacePlugmaTesting(options)],
			test: {
				globals: true,
				environment: 'node',
				testTimeout: options.timeout ?? 10000,
				watch: options.watch ?? false,
			},
		};

		log.info('Starting Vitest...');
		const vitest = await startVitest('test', [], {
			...testConfig,
			api: true,
		});

		// Wait for tests to complete and check results
		await vitest.start();
		const success = vitest.state.getCountOfFailedTests() === 0;

		return { success };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		log.error('Failed to run Vitest:', errorMessage);
		throw error;
	}
};

// Task exports removed - using direct function exports instead
export default runVitest;
