/**
 * Task to configure and run Vitest for plugin testing
 * Handles test discovery, execution, and reporting
 */

import type { GetTaskTypeFor, PluginOptions } from "#core/types.js";
import { createViteConfigs } from "#utils/config/create-vite-configs.js";
import { getUserFiles } from "#utils/config/get-user-files.js";
import { Logger } from "#utils/log/logger.js";
import { replacePlugmaTesting } from "#vite-plugins/test/replace-plugma-testing.js";
import { startVitest } from "vitest/node";
import { task } from "../runner.js";

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
export const runVitest = async (
	options: PluginOptions,
): Promise<RunVitestResult> => {
	const log = new Logger({ debug: options.debug });

	try {
		log.info("Loading plugin configuration...");
		const files = await getUserFiles(options);
		const configs = createViteConfigs(options, files);

		// Add our test plugin to the Vite config
		const testConfig = {
			...configs.main,
			plugins: [...(configs.main.dev.plugins || []), replacePlugmaTesting()],
			test: {
				globals: true,
				environment: "node",
				testTimeout: options.timeout ?? 10000,
				watch: options.watch ?? false,
			},
		};

		log.info("Starting Vitest...");
		const vitest = await startVitest("test", [], {
			...testConfig,
			api: true,
		});

		// Wait for tests to complete and check results
		await vitest.start();
		const success = vitest.state.getCountOfFailedTests() === 0;

		return { success };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		log.error("Failed to run Vitest:", errorMessage);
		throw error;
	}
};

export const RunVitestTask = task("test:run-vitest", runVitest);
export type RunVitestTask = GetTaskTypeFor<typeof RunVitestTask>;

export default RunVitestTask;
