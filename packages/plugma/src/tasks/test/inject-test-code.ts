/**
 * Task to inject testing framework code into the plugin
 * Handles adding test runner setup, WebSocket client, and test registry
 */

import type { GetTaskTypeFor, PluginOptions } from '#core/types.js';
import { Logger } from '#utils/log/logger.js';
import { getDirName } from '#utils/path.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { task } from '../runner.js';

const __dirname = getDirName(import.meta.url);

/**
 * Result type for the injectTestCode task
 */
export interface InjectTestCodeResult {
  /** The injected code */
  code: string;
}

/**
 * Loads and processes a framework file
 */
async function loadFrameworkFile(file: string): Promise<string> {
  const path = join(__dirname, '../../commands/test', file);
  const content = await readFile(path, 'utf-8');

  // Remove type imports and declarations as they're not needed at runtime
  return content
    .replace(/import type.*?;/g, '')
    .replace(/declare global.*?}/gs, '');
}

/**
 * Creates the test framework initialization code
 */
function createInitCode(): string {
  return `
// Initialize test framework
if (process.env.NODE_ENV === 'test') {
  // Create test registry instance
  const testRegistry = new TestRegistry();

  // Set up message handling
  figma.ui.onmessage = handleTestMessage;

  // Export test utilities to global scope
  Object.assign(window, {
    test: (name, fn) => testRegistry.register(name, fn),
    expect,
  });
}
`;
}

/**
 * Task that injects testing framework code into the plugin
 */
export const injectTestCode = async (
  options: PluginOptions,
): Promise<InjectTestCodeResult> => {
  const log = new Logger({ debug: options.debug });

  try {
    // Framework files in order of dependency
    const files = [
      'test-runner/expect.ts', // Base assertion functionality
      'test-runner/registry.ts', // Test registration and execution
      'test-runner/ws-client.ts', // Communication with test runner
    ];

    log.info('Loading test framework files...');
    const frameworkCode = await Promise.all(files.map(loadFrameworkFile));

    log.info('Creating initialization code...');
    const initCode = createInitCode();

    // Combine all code
    const code = `
// Test Framework Implementation
${frameworkCode.join('\n\n')}

// Framework Initialization
${initCode}
`;

    return { code };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('Failed to inject test code:', errorMessage);
    throw error;
  }
};

export const InjectTestCodeTask = task('test:inject-code', injectTestCode);
export type InjectTestCodeTask = GetTaskTypeFor<typeof InjectTestCodeTask>;

export default InjectTestCodeTask;
