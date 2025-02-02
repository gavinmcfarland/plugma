import type { TestFunction } from 'vitest';

/**
 * Test function interface that matches Vitest's test function signature
 * but includes additional properties for test configuration
 */
export interface PlugmaTest {
  name: string;
  fn: TestFunction;
  browserOnly: boolean;
  concurrent: boolean;
  fails: boolean;
  only: boolean;
  sequential: boolean;
  skip: boolean;
  todo: boolean;
}

/**
 * Creates a test function that wraps Vitest's test function with additional
 * configuration options specific to Plugma's testing needs.
 *
 * @param name - The name of the test
 * @param fn - The test function to execute
 * @returns A configured test function with Plugma-specific properties
 */
export function test(name: string, fn: TestFunction): PlugmaTest {
  // Validate test name
  if (!name || typeof name !== 'string') {
    throw new Error('Test name must be a non-empty string');
  }

  // Validate test function
  if (typeof fn !== 'function') {
    throw new Error('Test function must be a function');
  }

  // Create the test configuration
  const testConfig: PlugmaTest = {
    name,
    fn: async (...args) => {
      try {
        // Set up test timeout
        const timeoutId = setTimeout(() => {
          throw new Error('Test timed out after 30 seconds');
        }, 30000);

        // Run the test
        await fn(...args);

        // Clear timeout if test completes
        clearTimeout(timeoutId);
      } catch (error) {
        // Add plugin state to error if available
        if (error instanceof Error && globalThis.currentPlugin) {
          error.message = `${error.message}\nPlugin State: ${JSON.stringify(globalThis.currentPlugin)}`;
        }
        throw error;
      }
    },
    browserOnly: false,
    concurrent: false,
    fails: false,
    only: false,
    sequential: true,
    skip: false,
    todo: false,
  };

  return testConfig;
}
