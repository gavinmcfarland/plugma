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

		function runTest() {
			console.log('emitting RUN_TEST')
			socket!.emit('RUN_TEST', {
				room: 'figma',
				testName: name,
				testRunId: `${name}-${Date.now()}`,
			})
		}

		// FIXME: Replace with even listener for when plugin is ready
		await new Promise((resolve) => setTimeout(resolve, 500))
		runTest()
		socket.on('FILE_CHANGED', runTest)
		socket.on('TEST_ASSERTIONS', (message) => {
			console.log('TEST_ASSERTIONS', message)
		})
		socket.on('TEST_ERROR', (message) => {
			console.log('TEST_ERROR', message)
		})

		// Test needs to be open long enough for socket to connect. This is why it never
		// connected before. The delay won't be needed in production because this test
		// should return the respsonse of the actual test
		await new Promise((resolve) => setTimeout(resolve, 50000))

		// const result = await withTimeout()

		// WAIT FOR TEST RESULT which is a promise with message?

		let code = `
			expect(true).toBe(true)
		`
		const assertFn = new Function('expect', code)
		console.log('assertFn', assertFn)
		assertFn(vitestExpect, code)
	})
}

// Alias for test
export const it = test
