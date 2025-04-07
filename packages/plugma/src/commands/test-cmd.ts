/**
 * Test command implementation
 * Handles running tests for Figma plugins
 */

import type { PluginOptions } from '#core/types.js'
import { getRandomPort } from '#utils/get-random-port.js'
import { Logger } from '#utils/log/logger.js'
import { nanoid } from 'nanoid'
import { serial } from '../tasks/runner.js'
import { RunVitestTask } from '../tasks/test/run-vitest.js'
import type { TestCommandOptions } from './types.js'
import { LoadOptionsTask } from '#tasks/common/temp-options.js'
import { TestClient } from '../testing/test-client.js'
import { InitTestClientTask } from '../tasks/test/init-test-client.js'
import StartWebSocketsServerTask from '#tasks/server/websocket.js'

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
	const log = new Logger({ debug: options.debug })

	try {
		log.info('Starting test environment...')

		const pluginOptions: PluginOptions = {
			...options,
			mode: 'test',
			instanceId: nanoid(),
			port: options.port || getRandomPort(),
			command: 'test',
		}

		let savedOptions = await LoadOptionsTask.run(pluginOptions, undefined)
		pluginOptions.port = savedOptions ? savedOptions.port : pluginOptions.port

		// Set the WebSocket port in environment for the test process
		const wsPort = Number(pluginOptions.port)
		process.env.PORT = String(wsPort)

		// Enable websockets if not already enabled
		// pluginOptions.websockets = true

		// Execute tasks in sequence
		log.info('Executing test tasks...')

		const results = await serial(StartWebSocketsServerTask, InitTestClientTask, RunVitestTask)(pluginOptions)

		// // Get the test client instance
		// const testClient = results["test:init-client"].client as TestClient;

		// // Send the RUN_TESTS message through WebSocket
		// const runTestsMessage = {
		// 	type: "RUN_TESTS" as const,
		// 	source: "test",
		// };

		// log.debug("Sending RUN_TESTS message:", runTestsMessage);
		// await testClient.send(runTestsMessage);

		// // Clean up when done
		// testClient.close();
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		log.error('Failed to run tests:', errorMessage)
		throw error
	}
}
