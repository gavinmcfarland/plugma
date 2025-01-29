/**
 * Test command implementation
 * Handles running tests for Figma plugins
 */

import type { PluginOptions } from '#core/types.js';
import { getRandomPort } from '#utils/get-random-port.js';
import { Logger } from '#utils/log/logger.js';
import { nanoid } from 'nanoid';
import { serial } from '../../tasks/runner.js';
import { InjectTestCodeTask } from '../../tasks/test/inject-test-code.js';
import { RunVitestTask } from '../../tasks/test/run-vitest.js';
import { StartTestServerTask } from '../../tasks/test/start-test-server.js';
import type { TestCommandOptions } from './types.js';

/**
 * Main test command implementation
 * Sets up and runs tests for Figma plugins
 *
 * @param options - Test configuration options
 * @remarks
 * The test command:
 * 1. Injects test framework code into the plugin
 * 2. Starts WebSocket server for test communication
 * 3. Runs tests using Vitest
 */
export async function test(options: TestCommandOptions): Promise<void> {
  const log = new Logger({ debug: options.debug });

  try {
    log.info('Starting test environment...');

    const pluginOptions: PluginOptions = {
      ...options,
      mode: 'test',
      instanceId: nanoid(),
      port: options.port || getRandomPort(),
      command: 'test',
    };

    // Execute tasks in sequence
    log.info('Executing test tasks...');
    const { success } = await serial(
      InjectTestCodeTask, // Inject test framework
      StartTestServerTask, // Start WebSocket server
      RunVitestTask, // Run tests with Vitest
    )(pluginOptions);

    if (success) {
      log.success('All tests passed');
    } else {
      log.error('Some tests failed');
      process.exit(1);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('Failed to run tests:', errorMessage);
    throw error;
  }
}
