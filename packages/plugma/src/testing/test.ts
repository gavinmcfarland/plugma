// FIXME: Why does running the test for the first time trigger the plugin to reload?

import { defaultLogger as logger } from '#utils/log/logger.js'
import { test as vitestTest } from 'vitest'
import { executeAssertions } from './execute-assertions.js'
import { TestClient } from './test-client.js'
import type { TestFn } from './types.js'
import { createClient, SocketClient } from '#core/websockets/client.js'
import { expect as vitestExpect } from 'vitest'
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

function initializeSocket() {
	console.log('[socket] initializing socket')
	const socket = createClient({
		room: 'test',
		url: 'ws://localhost',
		port: process.env.PORT ? Number(process.env.PORT) + 1 : 3000,
	})

	// Wait for connection before proceeding
	// await new Promise<void>((resolve) => {
	socket.on('connect', () => {
		console.log('[socket] connected:', socket.id)
		// resolve()
	})
	// })

	return socket
}

const testRunCallbacks = new Map<
	string,
	{
		resolve: (value: any) => void
		reject: (error: Error) => void
	}
>()

function waitForTestResult(testRunId: string) {
	return new Promise((resolve, reject) => {
		// Store the callbacks for this test run
		testRunCallbacks.set(testRunId, { resolve, reject })

		// Set up a cleanup function to remove the callbacks after a timeout
		const cleanup = () => {
			testRunCallbacks.delete(testRunId)
		}

		// Return the promise that will be resolved by the callbacks
		return new Promise((res, rej) => {
			resolve = res
			reject = rej
		}).finally(cleanup)
	})
}

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

// Initialize socket and store it globally
let socket: SocketClient | null = null

/**
 * Wraps Vitest's test function to execute tests in Figma
 * @param name The name of the test
 * @param fn The test function to register
 */
export const test: TestFn = async (name, fn) => {
	console.log('----------test', name)

	return vitestTest(name, TEST_CONFIG, async () => {
		console.log('Running test:', name)

		// Initialize socket if not already done
		if (!socket) {
			console.log('Initializing new socket connection...')
			socket = initializeSocket()
		} else {
			console.log('Using existing socket connection')
		}

		// Create a unique test run ID
		const testRunId = `${name}-${Date.now()}`

		// Set up message handlers before running the test
		const testResultPromise = new Promise<TestResultMessage>((resolve, reject) => {
			socket!.on('TEST_ASSERTIONS', (message) => {
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
		socket!.emit('RUN_TEST', {
			room: 'figma',
			testName: name,
			testRunId: testRunId,
		})

		// Wait for test result with timeout
		const result = await withTimeout(testResultPromise, TEST_CONFIG.timeout, name)

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
