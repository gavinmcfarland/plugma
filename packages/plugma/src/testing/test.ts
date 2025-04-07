// FIXME: Why does running the test for the first time trigger the plugin to reload? Answer: Caused by launchPlugin function. Find out if there is a way to prevent from relauncgin if plugin already open.

import { test as vitestTest } from 'vitest'
import { executeAssertions } from './execute-assertions.js'
import type { TestFn } from './types.js'
import { SocketClient } from '#core/websockets/client.js'
import { getTestSocket, isSocketReady } from './socket.js'
import { getTestConfig } from '#utils/set-config.js'

/**
 * Configuration for test execution
 */
const TEST_CONFIG = {
	timeout: 30000, // 30 seconds
} as const

type TestResultMessage =
	| {
			type: 'TEST_ASSERTIONS'
			testRunId: string
			assertionCode: string // Adjust the type according to your assertion structure
			source: string
	  }
	| {
			type: 'TEST_ERROR'
			testRunId: string
			error: string
	  }

// Initialize socket and store it globally
let socket: SocketClient | null = null

// Add socket state tracking
let isSocketConnected = isSocketReady()

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, testName: string): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout>

	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			reject(new Error(`Test ${testName} timed out after ${timeoutMs}ms`))
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

const { port } = getTestConfig()

/**
 * Wraps Vitest's test function to execute tests in Figma
 * @param name The name of the test
 * @param fn The test function to register
 */
export const test: TestFn = async (name, fn) => {
	console.log('----------test', name)

	return vitestTest(name, TEST_CONFIG, async () => {
		console.log('Running test:', name)

		// Initialize socket if not already done or if disconnected
		if (!socket || !isSocketConnected) {
			console.log('Initializing new socket connection...')
			socket = getTestSocket(port)
		} else {
			console.log('Using existing socket connection')
		}

		// Create a unique test run ID
		const testRunId = `${name}-${Date.now()}`

		// Set up message handlers before running the test
		const testResultPromise = new Promise<TestResultMessage>((resolve, reject) => {
			socket!.on('TEST_ASSERTIONS', (message) => {
				console.log('TEST_ASSERTIONS', message)
				if (message.testRunId === testRunId) {
					resolve(message)
				}
			})
			socket!.on('TEST_ERROR', (message) => {
				if (message.testRunId === testRunId) {
					reject(new Error(message.error))
				}
			})
		})

		// Run the test
		function runTest(testRunId: string) {
			console.log('Running test:', name)
			socket!.emit('RUN_TEST', {
				room: 'figma',
				testName: name,
				testRunId: testRunId,
			})
		}

		// Wait for plugin to rebuild and reload
		// FIXME: We should listen for event from plugin UI
		await new Promise((resolve) => setTimeout(resolve, 600))

		runTest(testRunId)

		// Wait for test result with timeout
		const result = await withTimeout(testResultPromise, TEST_CONFIG.timeout, name)
		console.log('------- check', result)

		// Clean up message handlers
		socket!.off('TEST_ASSERTIONS')
		socket!.off('TEST_ERROR')

		console.log('result', result)

		// FIXME: How to handle errors?
		// Execute any assertions from the test result
		if ('assertionCode' in result) {
			await executeAssertions(result.assertionCode.split(';\n').filter(Boolean))
		}
	})
}

// Alias for test
export const it = test
