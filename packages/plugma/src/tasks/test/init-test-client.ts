/**
 * Task to initialize and connect the test client
 * Handles WebSocket connection setup for plugin testing
 */

import type { GetTaskTypeFor, PluginOptions } from '#core/types.js'
import { Logger } from '#utils/log/logger.js'
import { task } from '../runner.js'
import { TestClient } from '../../testing/test-client.js'

/**
 * Result type for the initTestClient task
 */
export interface InitTestClientResult {
	/** The initialized test client instance */
	client: TestClient
}

/**
 * Task that initializes and connects the test client
 */
export const initTestClient = async (options: PluginOptions): Promise<InitTestClientResult> => {
	const log = new Logger({ debug: options.debug })

	try {
		const port = options.port || Number(process.env.PORT)

		console.log('initTestClient', 1)

		const testClient = await TestClient.getInstance(port)

		return { client: testClient }
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		log.error('Failed to initialize test client:', errorMessage)
		throw error
	}
}

export const InitTestClientTask = task('test:init-client', initTestClient)
export type InitTestClientTask = GetTaskTypeFor<typeof InitTestClientTask>

export default InitTestClientTask
