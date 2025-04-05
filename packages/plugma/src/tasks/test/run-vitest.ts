/**
 * Task to configure and run Vitest for plugin testing
 * Handles test discovery, execution, and reporting
 */

import type { GetTaskTypeFor, PluginOptions } from '#core/types.js'
import { Logger } from '#utils/log/logger.js'
import { startVitest } from 'vitest/node'
import { task } from '../runner.js'
import initTestClient from '../../vitest-plugins/init-test-client.js'
import { type UserConfig } from 'vite'

/**
 * Result type for the runVitest task
 */
export interface RunVitestResult {
	/** Whether all tests passed */
	success: boolean
}

/**
 * Task that configures and runs Vitest in the user's plugin project
 */
export const runVitest = async (options: PluginOptions): Promise<RunVitestResult> => {
	const log = new Logger({ debug: options.debug })

	try {
		// console.log("Starting Vitest...");
		// Add our test plugin to the Vite config
		const testConfig: UserConfig = {
			clearScreen: false,
			test: {
				globals: true,
				environment: 'node',
				watch: options.watch ?? false,
				setupFiles: ['../../src/vitest-plugins/setup-socket.ts'],
			},
			// plugins: [initTestClient()],
		}

		// console.log("testConfig", testConfig);
		log.info('Starting Vitest...')
		const vitest = await startVitest('test', [], {}, testConfig)

		// Wait for tests to complete and check results

		const success = vitest.state.getCountOfFailedTests() === 0

		return { success }
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		log.error('Failed to run Vitest:', errorMessage)
		throw error
	}
}

export const RunVitestTask = task('test:run-vitest', runVitest)
export type RunVitestTask = GetTaskTypeFor<typeof RunVitestTask>

export default RunVitestTask
