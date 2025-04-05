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

		// Register event listeners before waiting for connection
		socket.on('BUILD_STARTED', runTest)
		socket.on('FILE_CHANGED', runTest)

		// Test needs to be open long enough for socket to connect. This is why it never
		// connected before. The delay won't be needed in production because this test
		// should return the respsonse of the actual test
		await new Promise((resolve) => setTimeout(resolve, 50000))

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
