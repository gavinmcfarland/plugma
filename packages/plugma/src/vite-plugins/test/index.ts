/**
 * Vite plugin for injecting test framework code
 */

import { getDirName } from '#utils/get-dir-name.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Plugin } from 'vite';

const __dirname = getDirName();

/**
 * Creates a virtual module with our test framework code
 */
async function createTestModule(): Promise<string> {
  // Load our test framework files
  const files = [
    ['test-runner/expect.ts', 'expect'],
    ['test-runner/registry.ts', 'registry'],
    ['test-runner/ws-client.ts', 'ws-client'],
  ];

  const imports = await Promise.all(
    files.map(async ([file]) => {
      const path = join(__dirname, '../../commands/test', file);
      const content = await readFile(path, 'utf-8');
      // Remove type imports and declarations
      return content
        .replace(/import type.*?;/g, '')
        .replace(/declare global.*?}/gs, '');
    }),
  );

  // Create the virtual module with dual-environment test function
  return `
${imports.join('\n\n')}

// Dual-environment test function
export const test = async (name, fn) => {
  // In Figma: Register the test
  if (typeof figma !== 'undefined') {
    registry.register(name, fn);
    return;
  }

  // In Node: Create a Vitest test that communicates with Figma
  return vitestTest(name, { timeout: 30000 }, async () => {
    const testRunId = \`\${name}-\${Date.now()}\`;

    try {
      // Wait for test results
      const assertionsPromise = testClient.waitForTestResult(testRunId);

      // Send test execution message
      await testClient.send({
        type: 'RUN_TEST',
        testName: name,
        testRunId,
      });

      // Wait for and process results
      const result = await assertionsPromise;

      if (result.type === 'TEST_ERROR') {
        throw new Error(result.error);
      }

      // Execute the assertions in Vitest
      result.assertions.forEach(assertion => {
        eval(assertion);
      });
    } catch (error) {
      if (error.name === 'TestTimeoutError') {
        await testClient.send({
          type: 'CANCEL_TEST',
          testName: name,
          testRunId,
          reason: 'timeout',
        });
      }
      throw error;
    }
  });
};

// Export test utilities
export { expect } from './expect';
`;
}

/**
 * Creates a Vite plugin that injects our test framework
 */
export function plugmaTest(): Plugin {
  let testModule: string;

  return {
    name: 'plugma:test',

    async buildStart() {
      // Load test module once at start
      testModule = await createTestModule();
    },

    resolveId(id: string) {
      // Intercept plugma/testing imports
      if (id === 'plugma/testing') {
        return 'virtual:plugma/testing';
      }
    },

    async load(id: string) {
      // Return our virtual module
      if (id === 'virtual:plugma/testing') {
        return testModule;
      }
    },
  };
}
