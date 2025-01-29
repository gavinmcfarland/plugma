/**
 * Types for the test command and framework
 */

import type { PluginOptions } from '#core/types.js';
import type { BaseCommandOptions } from '../types.js';

/**
 * Options for the test command
 */
export type TestCommandOptions = BaseCommandOptions &
  PluginOptions & {
    /** Test files pattern */
    testMatch?: string[];
    /** Whether to watch for changes */
    watch?: boolean;
    /** Test timeout in milliseconds */
    timeout?: number;
    /** WebSocket server port */
    port?: number;
    /** WebSocket server host */
    host?: string;
    /** Whether to run in debug mode */
    debug?: boolean;
  };

/**
 * Test context passed to each test function
 */
export interface TestContext {
  /** Name of the test */
  name: string;
  /** List of assertions made during the test */
  assertions: string[];
  /** When the test started */
  startTime: number;
  /** When the test ended */
  endTime: number | null;
  /** How long the test took */
  duration: number | null;
}

/**
 * Messages passed between Node and Figma environments
 */
export type TestMessage =
  | { type: 'RUN_TEST'; testName: string; testRunId: string }
  | { type: 'TEST_RESULT'; testRunId: string; passed: boolean }
  | { type: 'TEST_ERROR'; testRunId: string; error: string }
  | { type: 'TEST_ASSERTIONS'; testRunId: string; assertions: string[] };
