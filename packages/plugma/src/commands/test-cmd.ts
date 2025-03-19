/**
 * Test command implementation
 * Handles running tests for Figma plugins
 */

import type { PluginOptions } from "#core/types.js";
import { getRandomPort } from "#utils/get-random-port.js";
import { Logger } from "#utils/log/logger.js";
import { nanoid } from "nanoid";
import { serial } from "../tasks/runner.js";
import { RunVitestTask } from "../tasks/test/run-vitest.js";
import type { TestCommandOptions } from "./types.js";

/**
 * Main test command implementation
 * Sets up and runs tests for Figma plugins
 *
 * @param options - Test configuration options
 * @remarks
 * The test command:
 * 1. Runs tests using Vitest
 */
export async function test(options: TestCommandOptions): Promise<void> {
	const log = new Logger({ debug: options.debug });

	try {
		log.info("Starting test environment...");

		const pluginOptions: PluginOptions = {
			...options,
			mode: "test",
			instanceId: nanoid(),
			port: options.port || getRandomPort(),
			command: "test",
		};

		// Execute tasks in sequence
		log.info("Executing test tasks...");
		const results = await serial(
			RunVitestTask, // Run tests with Vitest
		)(pluginOptions);

		if (results["test:run-vitest"].success) {
			log.success("All tests passed");
		} else {
			log.error("Some tests failed");
			// process.exit(1);
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		log.error("Failed to run tests:", errorMessage);
		throw error;
	}
}
