/**
 * Assertion implementation for tests
 * Uses a proxy to record assertion chains that can be replayed in Vitest
 */

import type { ExpectStatic } from 'vitest';
import type { TestContext } from '../commands/test/types.js';

/**
 * Current test context
 */
export const currentTest: TestContext = {
  name: '',
  assertions: [],
  startTime: 0,
  endTime: null,
  duration: null,
};

type ChainEntry = [string, unknown[]?];
type ChainArray = ChainEntry[];

// Base type for callable objects
type CallableObject = {
  (...args: unknown[]): unknown;
  [key: string]: unknown;
};

interface ExpectProxy extends CallableObject {
  [Symbol.toStringTag]: string;
  [Symbol.toPrimitive]: () => ChainArray;
  [Symbol.iterator]: () => Iterator<ChainEntry>;
  toJSON: () => ChainArray;
}

/**
 * Creates a proxy that records assertion chains
 */
export const expect = (value: unknown): ExpectProxy => {
  const chain: ChainArray = [['expect', [value]]];

  const handler: ProxyHandler<CallableObject> = {
    get: (_target, prop: string | symbol): unknown => {
      if (typeof prop === 'symbol') {
        if (prop === Symbol.toStringTag) {
          return 'Assertion';
        }
        if (prop === Symbol.toPrimitive) {
          return () => chain;
        }
        if (prop === Symbol.iterator) {
          return () => chain[Symbol.iterator]();
        }
      }
      if (typeof prop === 'string') {
        if (prop === 'toJSON') {
          return () => chain;
        }

        // Record the property access
        chain.push([prop]);
        return proxy;
      }
      return undefined;
    },
    apply: (_target, _thisArg, args: unknown[]): ExpectProxy => {
      // Record the function call
      const lastEntry = chain[chain.length - 1];
      lastEntry[1] = args;

      // Convert the chain to a string and add to assertions
      const assertion = chainToString(chain);
      currentTest.assertions.push(assertion);

      return proxy;
    },
  };

  const proxy = new Proxy((() => {}) as CallableObject, handler) as ExpectProxy;
  return proxy;
};

/**
 * Converts a chain array to an assertion string
 */
function chainToString(chain: ChainArray): string {
  return chain
    .map(([name, args]) => {
      if (args) {
        const serializedArgs = args.map(serializeValue).join(', ');
        return `${name}(${serializedArgs})`;
      }
      return name;
    })
    .join('.');
}

/**
 * Serializes a value for the assertion string
 */
function serializeValue(value: unknown): string {
  // Handle Figma nodes
  if (value && typeof value === 'object' && 'type' in value) {
    const node = value as { type: string; id: string };
    return `{type:"${node.type}",id:"${node.id}"}`;
  }

  // Handle functions (for toBeInstanceOf)
  if (typeof value === 'function') {
    return value.name;
  }

  // Handle other values
  return JSON.stringify(value);
}

// Add Vitest types for type checking and autocompletion
declare global {
  // Extend the global scope with Vitest's expect
  const vitestExpect: ExpectStatic;

  namespace Vi {
    interface Assertion {
      // Common matchers
      toBe(expected: unknown): void;
      toEqual(expected: unknown): void;
      toStrictEqual(expected: unknown): void;
      toBeInstanceOf(expected: Function): void;
      toBeDefined(): void;
      toBeUndefined(): void;
      toBeNull(): void;
      toBeTruthy(): void;
      toBeFalsy(): void;
      toContain(expected: unknown): void;
      toContainEqual(expected: unknown): void;
      toHaveLength(expected: number): void;
      toMatch(expected: RegExp | string): void;
      toThrow(expected?: RegExp | string | Error): void;

      // Modifiers
      not: Vi.Assertion;
      resolves: Vi.Assertion;
      rejects: Vi.Assertion;

      // Figma-specific matchers (can be extended)
      toBeNode(type?: string): void;
      toHavePluginData(key: string, value: string): void;
    }
  }
}
