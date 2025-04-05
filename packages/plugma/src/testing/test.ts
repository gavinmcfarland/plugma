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

		// generate a unique testRunId so we can pair the
		// TEST_RUN and TEST_ASSERTIONS (or TEST_ERROR) messages

		// on TEST_ASSERTIONS, execute the assertions
	})
}

// Alias for test
export const it = test
