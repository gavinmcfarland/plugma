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
 * Error class for test timeouts
 */
class TestTimeoutError extends Error {
	constructor(testName: string) {
		super(`Test "${testName}" timed out after ${TEST_CONFIG.timeout}ms`)
		this.name = 'TestTimeoutError'
	}
}

/**
 * Error class for test execution errors
 */
class TestExecutionError extends Error {
	constructor(
		message: string,
		public readonly testName: string,
		public readonly pluginState?: unknown,
		public readonly originalError?: Error,
	) {
		super(message)
		this.name = 'TestExecutionError'

		// Preserve the original stack trace if available
		if (originalError?.stack) {
			this.stack = originalError.stack
		}
	}
}

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param testName Name of the test (for error messages)
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, testName: string): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout>

	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			reject(new TestTimeoutError(testName))
		}, timeoutMs)
	})

	return Promise.race([promise, timeoutPromise])
		.then((result) => {
			clearTimeout(timeoutId)
			return result
		})
		.catch((error) => {
			clearTimeout(timeoutId)
			throw error
		})
}

/**
 * Wraps Vitest's test function to execute tests in Figma
 * @param name The name of the test
 * @param fn The test function to register
 */
export const test: TestFn = async (name, fn) => {
	console.log('test', name)
	// In Node: Create a Vitest test that sends a message to Figma
	return vitestTest(name, TEST_CONFIG, async () => {
		logger.debug('Running test:', name)

		// Get the test client instance using environment variable
		const socket = TestClient.getInstance()

		await new Promise<void>((resolve) => {
			if (socket.connected) {
				resolve()
			} else {
				socket.once('connect', () => resolve())
			}
		})

		socket.on('FILE_CHANGED', (file) => {
			socket.emit('RUN_TEST', {
				testName: 'test',
				testRunId: `${name}-${Date.now()}`,
				room: 'figma',
			})
			console.log('RUN_TEST sent', file)
		})

		// generate a unique testRunId so we can pair the
		// TEST_RUN and TEST_ASSERTIONS (or TEST_ERROR) messages

		// try {
		// Emit RUN_TEST message

		// // Wait TEST_RESULT message
		// testClient.on('TEST_RESULT', (result) => {
		// 	console.log('TEST_RESULT', result)

		// 	// Execute assertions
		// 	executeAssertions(result.assertionCode.split(';\n').filter(Boolean))
		// })
		// }
		// catch (error) {
		// 	if (error instanceof TestTimeoutError) {
		// 		logger.error('Test timed out:', error.message)
		// 		testClient.emit('CANCEL_TEST', {
		// 			testName: name,
		// 			testRunId: testRunId,
		// 			reason: 'timeout',
		// 			source: 'test',
		// 		})
		// 		throw error
		// 	}

		// 	// If it's already a TestExecutionError, just rethrow it
		// 	if (error instanceof TestExecutionError) {
		// 		logger.error('Test execution failed:', {
		// 			message: error.message,
		// 			testName: error.testName,
		// 			pluginState: error.pluginState,
		// 			stack: error.stack,
		// 		})
		// 		throw error
		// 	}

		// 	// Otherwise wrap the error with additional context
		// 	logger.error('Error running test:', error)
		// 	throw new TestExecutionError(
		// 		error instanceof Error ? error.message : String(error),
		// 		name,
		// 		undefined,
		// 		error instanceof Error ? error : undefined,
		// 	)
		// }
	})
}

// Alias for test
export const it = test
