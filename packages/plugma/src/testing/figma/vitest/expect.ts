import type { ExpectStatic } from 'vitest'

import type { TestContext } from '../../types.js'
import { testContext } from '../test-context.js'

/**
 * @file Virtual Expect implementation for Figma plugin testing
 *
 * This module provides a Vitest-compatible expect proxy that records assertion
 * chains without executing them. The recorded chains can be serialized and
 * executed later in a Node.js environment with real Vitest.
 *
 * Key components:
 * 1. expect() proxy - Records method/property chains
 * 2. ChainArray - Serializable assertion structure
 * 3. TestContext - Tracks test metadata and assertions
 *
 * Flow:
 * 1. User writes tests with standard Vitest syntax
 * 2. Proxy records all expect().toBe() chains as ChainArrays
 * 3. Chains are sent to Node.js test runner via WebSocket
 * 4. executeAssertions() replays chains with real Vitest
 */

/**
 * Represents a single step in an assertion chain
 * @example ['toBe', [5]] for `.toBe(5)`
 * @example ['toHaveProperty', ['position.x']] for `.toHaveProperty('position.x')`
 */
export type ChainEntry = [string, unknown[]?]

/**
 * Complete assertion chain starting with expect()
 * @example [['expect', [5]], ['toBeGreaterThan', [3]]]
 */
export type ChainArray = ChainEntry[]

/**
 * Proxy interface that mimics Vitest's expect behavior while recording chains
 */
interface ExpectProxy {
	(): void
	[key: string]: unknown
	[Symbol.toStringTag]: 'ExpectProxy'
}

/**
 * Global test context tracking current test state
 */
export const currentTest: TestContext = {
	name: '',
	assertions: [],
	startTime: 0,
	endTime: null,
	duration: null,
}

/**
 * Type-safe proxy handler for assertion chain recording
 */
type ProxyHandler<T> = {
	get(_target: T, prop: string | symbol, receiver: any): unknown
	apply(_target: T, thisArg: any, args: unknown[]): unknown
}

/**
 * Serializes values for safe code generation
 */
function serializeValue(value: unknown): string {
	// Handle Figma nodes
	if (value && typeof value === 'object') {
		if ('type' in value && 'id' in value) {
			return `{ type: '${value.type}', id: '${value.id}' }`
		}
		return JSON.stringify(value)
	}

	// Handle special identifiers
	if (typeof value === 'string' && value.startsWith('test-id-')) {
		return `'${value}'`
	}

	// Handle primitives
	return JSON.stringify(value)
}

/**
 * Creates a chain-recording proxy for assertion operations
 * @param value - Initial value passed to expect()
 * @returns Proxy that records all assertion operations
 *
 * @example
 * const proxy = createExpectProxy(5);
 * proxy.toBe(3); // Records [['expect', [5]], ['toBe', [3]]]
 */
const createExpectProxy = (value: unknown): ExpectProxy => {
	let code = `expect(${serializeValue(value)})`
	const currentValue = value

	const handler: ProxyHandler<ExpectProxy> = {
		get(target, prop, receiver) {
			if (typeof prop === 'symbol') {
				if (prop === Symbol.toStringTag) return target[Symbol.toStringTag]
				if (prop === Symbol.toPrimitive) return () => code
				return Reflect.get(target, prop, receiver)
			}

			if (prop === 'toJSON') return () => code

			code += `.${prop}`
			return receiver
		},

		apply(target, thisArg, args) {
			code += `(${args.map(serializeValue).join(', ')})`
			testContext.current.assertions.push(code)

			// Reset chain with current value
			code = `expect(${serializeValue(currentValue)})`
			return thisArg
		},
	}

	const proxyTarget = () => {}
	;(proxyTarget as any)[Symbol.toStringTag] = 'ExpectProxy' as const
	return new Proxy(proxyTarget as ExpectProxy, handler)
}

/**
 * Vitest-compatible expect function replacement
 *
 * Provides:
 * - Full TypeScript type safety
 * - IDE autocompletion
 * - Chain recording for all assertions
 *
 * @example
 * expect(5).toBeGreaterThan(3) // Recorded as ChainArray
 */
export const expect: ExpectStatic = ((value: unknown) => {
	return createExpectProxy(value)
}) as unknown as ExpectStatic
