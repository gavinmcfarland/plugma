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
import { LoadOptionsTask } from "#tasks/common/temp-options.js";
import { TestClient } from "../testing/test-client.js";
import { InitTestClientTask } from "../tasks/test/init-test-client.js";

/**
 * Main test command implementation
 * Sets up and runs tests for Figma plugins
 *
 * @param options - Test configuration options
 * @remarks
 * The test command:
 * 1. Initializes the test client
 * 2. Runs tests using Vitest
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

		let savedOptions = await LoadOptionsTask.run(pluginOptions, undefined);
		const port = savedOptions ? savedOptions.port : pluginOptions.port;

		// Set the WebSocket port in environment for the test process
		const wsPort = Number(port) + 1;
		process.env.TEST_WS_PORT = String(wsPort);

		// Execute tasks in sequence
		log.info("Executing test tasks...");

		const results = await serial(
			InitTestClientTask, // Initialize test client
			RunVitestTask, // Run tests with Vitest
		)(pluginOptions);

		if (results["test:run-vitest"].success) {
			log.success("All tests passed");
		} else {
			log.error("Some tests failed");
		}

		// Clean up when done
		const testClient = results["test:init-client"].client;
		testClient.close();
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		log.error("Failed to run tests:", errorMessage);
		throw error;
	}
}
