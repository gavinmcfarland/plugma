/**
 * Test registry implementation
 * Manages test registration and execution in the Figma environment
 */

import { Logger } from '#utils/log/logger.js';
import {
  currentTest,
  expect as plugmaExpect,
} from '../../../testing/expect.js';
import type { TestContext, TestMessage } from '../types.js';

/**
 * Type for test results
 */
interface TestResult {
  testName: string;
  error: Error | null;
  pluginState: string;
  assertions: string[];
  startTime: number;
  endTime: number;
  duration: number;
}

/**
 * Type for test functions that can be registered
 */
export type TestFunction = (
  context: TestContext,
  expect: typeof plugmaExpect,
) => Promise<void> | void;

/**
 * Type for lifecycle hooks
 */
export type LifecycleHook = () => Promise<void> | void;

/**
 * Registry to store and manage test functions in Figma
 */
class TestRegistry {
  private tests = new Map<string, TestFunction>();
  private beforeEachHooks: LifecycleHook[] = [];
  private afterEachHooks: LifecycleHook[] = [];
  private contexts = new Map<string, TestContext>();
  private logger = new Logger({ debug: true });

  /**
   * Register a test function with a given name
   */
  register(name: string, fn: TestFunction): void {
    this.logger.debug('Registering test:', name);
    if (this.tests.has(name)) {
      throw new Error('Test already registered');
    }
    if (typeof fn !== 'function') {
      throw new Error('Test function must be a function');
    }
    this.tests.set(name, fn);
  }

  /**
   * Create a test context for a given test
   */
  private createContext(name: string): TestContext {
    if (!this.tests.has(name)) {
      throw new Error(`No test registered with name: ${name}`);
    }

    const context: TestContext = {
      name,
      assertions: [],
      startTime: 0,
      endTime: null,
      duration: null,
    };

    this.contexts.set(name, context);
    return context;
  }

  /**
   * Run a registered test function by name
   */
  async runTest(name: string): Promise<TestResult> {
    const fn = this.tests.get(name);
    if (!fn) {
      throw new Error(`Test "${name}" not found`);
    }

    // Initialize test context
    const context = this.createContext(name);
    const startTime = Date.now();
    context.startTime = startTime;

    // Set current test context
    currentTest.name = name;
    currentTest.assertions = [];
    currentTest.startTime = startTime;

    try {
      // Execute test function and wait for it to complete
      await Promise.resolve(fn(context, plugmaExpect));

      // Add a delay to ensure timing difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Update timing after test completes
      const endTime = Date.now();
      context.endTime = endTime;
      context.duration = endTime - startTime;

      return {
        testName: name,
        error: null,
        pluginState: figma.root.getPluginData('state'),
        assertions: currentTest.assertions,
        startTime,
        endTime,
        duration: endTime - startTime,
      };
    } catch (error) {
      // Update timing on error
      const endTime = Date.now();
      context.endTime = endTime;
      context.duration = endTime - startTime;

      const testError = new Error('Test error');
      testError.name = 'TestError';

      return {
        testName: name,
        error: testError,
        pluginState: figma.root.getPluginData('state'),
        assertions: currentTest.assertions,
        startTime,
        endTime,
        duration: endTime - startTime,
      };
    } finally {
      // Reset test context
      currentTest.name = '';
      currentTest.assertions = [];
      currentTest.startTime = 0;
      currentTest.endTime = null;
      currentTest.duration = null;
      this.contexts.delete(name);
    }
  }

  /**
   * Get all registered test names
   */
  getTestNames(): string[] {
    return Array.from(this.tests.keys());
  }

  /**
   * Clear all registered tests and contexts
   */
  clear(): void {
    this.tests.clear();
    this.contexts.clear();
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
    currentTest.name = '';
    currentTest.assertions = [];
    currentTest.startTime = 0;
    currentTest.endTime = null;
    currentTest.duration = null;
  }
}

/**
 * Singleton instance of the test registry
 */
export const registry = new TestRegistry();

/**
 * Handles test execution messages in Figma
 */
export function handleTestMessage(message: TestMessage): void {
  const logger = new Logger({ debug: true });
  logger.debug('Received message:', message);

  try {
    if (message.type === 'RUN_TEST') {
      logger.debug('Running test:', message.testName);

      try {
        registry
          .runTest(message.testName)
          .then((result) => {
            let response: TestMessage;

            if (result.error) {
              response = {
                type: 'TEST_ERROR',
                testRunId: message.testRunId,
                error: result.error.message,
              };
            } else {
              response = {
                type: 'TEST_ASSERTIONS',
                testRunId: message.testRunId,
                assertions: result.assertions,
              };
            }

            logger.debug(`[registry] 📮 ${response.type}:`, response);
            figma.ui.postMessage(response);
          })
          .catch((error) => {
            const response: TestMessage = {
              type: 'TEST_ERROR',
              testRunId: message.testRunId,
              error: error instanceof Error ? error.message : String(error),
            };
            logger.error('Error executing test:', error);
            figma.ui.postMessage(response);
          });
      } catch (error) {
        const response: TestMessage = {
          type: 'TEST_ERROR',
          testRunId: message.testRunId,
          error: error instanceof Error ? error.message : String(error),
        };
        logger.error('Error executing test:', error);
        figma.ui.postMessage(response);
      }
    }
  } catch (error) {
    const response: TestMessage = {
      type: 'TEST_ERROR',
      testRunId: message.testRunId,
      error: error instanceof Error ? error.message : String(error),
    };
    logger.error('Error handling message:', error);
    figma.ui.postMessage(response);
  }
}

// Set up message handler in Figma environment
if (typeof figma !== 'undefined') {
  figma.ui.onmessage = handleTestMessage;
}
