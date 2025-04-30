/**
 * Test registry implementation for the Plugma runtime environment.
 * Manages test registration, execution, and lifecycle hooks in the Figma plugin environment.
 *
 * @module TestRegistry
 */

import type { TestContext } from '../types.js'
import { expect as plugmaViteExpect } from './vitest/expect.js'
import { nodeToObject } from './nodeToObject.js'
import { testContext } from './test-context.js'

/**
 * Represents the result of a test execution
 */
interface TestResult {
	testName: string
	error: Error | null
	pluginState: string
	assertions: string[]
	startTime: number
	endTime: number
	duration: number
	returnValue: unknown
}

/**
 * Function signature for test implementations
 */
export type TestFunction = (context: TestContext, expect: typeof plugmaViteExpect) => Promise<void> | void

/**
 * Function signature for test lifecycle hooks
 */
export type LifecycleHook = () => Promise<void> | void

/**
 * Registry to store and manage test functions in the Figma plugin environment.
 * Handles test registration, execution, and lifecycle management.
 */
class TestRegistry {
	private tests = new Map<string, TestFunction>()
	private beforeEachHooks: LifecycleHook[] = []
	private afterEachHooks: LifecycleHook[] = []
	private contexts = new Map<string, TestContext>()

	/**
	 * Register a test function with a given name
	 * @param name - The name of the test
	 * @param fn - The test function to register
	 * @throws {Error} If a test with the same name is already registered or if fn is not a function
	 */
	register(name: string, fn: TestFunction): void {
		if (this.tests.has(name)) {
			throw new Error('Test already registered')
		}
		if (typeof fn !== 'function') {
			throw new Error('Test function must be a function')
		}
		this.tests.set(name, fn)
	}

	/**
	 * Register a hook to run before each test
	 * @param fn - The hook function to register
	 */
	beforeEach(fn: LifecycleHook): void {
		this.beforeEachHooks.push(fn)
	}

	/**
	 * Register a hook to run after each test
	 * @param fn - The hook function to register
	 */
	afterEach(fn: LifecycleHook): void {
		this.afterEachHooks.push(fn)
	}

	/**
	 * Check if a test is registered with the given name
	 * @param name - The name of the test to check
	 * @returns True if the test exists, false otherwise
	 */
	has(name: string): boolean {
		return this.tests.has(name)
	}

	/**
	 * Create a test context for a given test
	 * @param name - The name of the test
	 * @returns The test context
	 * @throws {Error} If no test is registered with the given name
	 */
	private createContext(name: string): TestContext {
		// if (!this.tests.has(name)) {
		// 	throw new Error(`No test registered with name: ${name}`)
		// }

		const context: TestContext = {
			name,
			assertions: [],
			startTime: 0,
			endTime: null,
			duration: null,
		}

		this.contexts.set(name, context)
		return context
	}

	/**
	 * Execute all registered beforeEach hooks
	 * @private
	 */
	private async executeBeforeEachHooks(): Promise<void> {
		for (const hook of this.beforeEachHooks) {
			await Promise.resolve(hook())
		}
	}

	/**
	 * Execute all registered afterEach hooks
	 * @private
	 */
	private async executeAfterEachHooks(): Promise<void> {
		for (const hook of this.afterEachHooks) {
			await Promise.resolve(hook())
		}
	}

	/**
	 * Run a registered test function by name
	 * @param name - The name of the test to run
	 * @returns A promise that resolves with the test result
	 * @throws {Error} If no test is registered with the given name
	 */
	async runTest(name: string | undefined, testFn?: string): Promise<TestResult> {
		let fn: TestFunction | undefined = this.tests.get(name || '')
		const testName = name || 'anonymous test'

		if (!fn && !testFn) {
			throw new Error('No test function provided')
		}

		// Initialize test context
		const context = this.createContext(testName)
		const startTime = Date.now()
		context.startTime = startTime

		// Set up test context
		testContext.current = context

		try {
			// Execute beforeEach hooks
			await this.executeBeforeEachHooks()

			// Execute test function and capture return value
			let returnValue: unknown

			if (testFn) {
				const fn = new Function('context', 'expect', `return (${testFn})(context, expect)`)
				returnValue = await Promise.resolve(fn(context, plugmaViteExpect))
				returnValue = nodeToObject(returnValue as SceneNode)
			} else {
				returnValue = await Promise.resolve(fn!(context, plugmaViteExpect))
			}

			// Add timing precision delay
			await new Promise((resolve) => setTimeout(resolve, 10))

			// Execute afterEach hooks
			await this.executeAfterEachHooks()

			// Update timing after test completes
			const endTime = Date.now()
			context.endTime = endTime
			context.duration = endTime - startTime

			return {
				testName: testName,
				error: null,
				pluginState: figma.root.getPluginData('state'),
				assertions: [...context.assertions],
				startTime,
				endTime,
				duration: endTime - startTime,
				returnValue,
			}
		} catch (error) {
			// Update timing on error
			const endTime = Date.now()
			context.endTime = endTime
			context.duration = endTime - startTime

			// Standardize error format
			const testError = error instanceof Error ? error : new Error(String(error))
			testError.name = 'TestError'

			return {
				testName: testName,
				error: testError,
				pluginState: figma.root.getPluginData('state'),
				assertions: [...context.assertions],
				startTime,
				endTime,
				duration: endTime - startTime,
				returnValue: undefined,
			}
		} finally {
			// Reset test context
			testContext.reset()
			this.contexts.delete(testName)
		}
	}

	/**
	 * Get all registered test names
	 * @returns Array of registered test names
	 */
	getTestNames(): string[] {
		return Array.from(this.tests.keys())
	}

	/**
	 * Clear all registered tests, contexts, and hooks
	 */
	clear(): void {
		this.tests.clear()
		this.contexts.clear()
		this.beforeEachHooks = []
		this.afterEachHooks = []
		testContext.reset()
	}
}

/**
 * Singleton instance of the test registry
 */
export const registry = new TestRegistry()
