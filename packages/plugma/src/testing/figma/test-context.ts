/**
 * Test context management for the Plugma runtime environment.
 * Provides a thread-safe way to manage test state during execution.
 *
 * @module TestContext
 */

import type { TestContext } from '../types.js'

/**
 * Manages the current test context in a thread-safe way.
 * This is used internally by the test registry to track the currently executing test.
 */
class TestContextManager {
	private _current: TestContext | null = null

	/**
	 * Get the current test context
	 * @throws {Error} If no test context is set
	 */
	get current(): TestContext {
		if (!this._current) {
			throw new Error('No test context set')
		}
		return this._current
	}

	/**
	 * Set the current test context
	 * @param context - The test context to set
	 */
	set current(context: TestContext) {
		this._current = context
	}

	/**
	 * Reset the test context to its initial state
	 * This should be called after each test completes
	 */
	reset(): void {
		this._current = null
	}

	/**
	 * Check if a test context is currently set
	 */
	hasContext(): boolean {
		return this._current !== null
	}
}

/**
 * Singleton instance of the test context manager
 */
export const testContext = new TestContextManager()
