import { defaultLogger as logger } from '#utils/log/logger.js'
import { test as vitestTest } from 'vitest'
import { executeAssertions } from './execute-assertions.js'
import { TestClient } from './test-client.js'
import type { TestFn } from './types.js'

/**
 * Configuration for test execution
 */
const TEST_CONFIG = {
	timeout: 30000, // 30 seconds
} as const

/**
 * Wraps Vitest's test function to execute tests in Figma
 * @param name The name of the test
 * @param fn The test function to register
 */
export const test: TestFn = async (name, fn) => {
	console.log('----------test', name)
	// In Node: Create a Vitest test that sends a message to Figma
	return vitestTest(name, TEST_CONFIG, async () => {
		logger.debug('Running test:', name)

		// Get the test client instance using environment variable
		console.log('initTestClient', 2)
		const socket = await TestClient.getInstance()

		const runTest = (triggerSource: string, data?: unknown) => {
			console.log('emitting RUN_TEST')
			socket.emit('RUN_TEST', {
				testName: 'test',
				testRunId: `${Date.now()}`,
				room: 'figma',
			})
			console.log('RUN_TEST sent via', triggerSource, data)
		}

		// TODO: Consider whether there should be an event that triggers this
		runTest('initial trigger')

		socket.on('BUILD_STARTED', (data) => runTest('build started', data))
		socket.on('FILE_CHANGED', (file) => runTest('file changed', file))

		// generate a unique testRunId so we can pair the
		// TEST_RUN and TEST_ASSERTIONS (or TEST_ERROR) messages

		// on TEST_ASSERTIONS, execute the assertions
	})
}

// Alias for test
export const it = test
