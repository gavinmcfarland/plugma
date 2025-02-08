import type { TestContext, TestMessage } from '#testing/types';
import { expect as plugmaExpect } from './expect';
import { registry } from './registry';

/**
 * Handles test execution messages in the Figma plugin environment
 * @param message - The message received from the test runner
 */

export function handleTestMessage(message: TestMessage): void {
  // logger.debug('Received message:', message);
  try {
    switch (message.type) {
      case 'REGISTER_TEST': {
        // logger.debug('Registering test:', message.testName);
        try {
          // Create test function from string representation
          const testFn = async (
            context: TestContext,
            expect: typeof plugmaExpect,
          ) => {
            try {
              const fn = new Function(
                'context',
                'plugmaExpect',
                `
                return (async () => {
                  try {
                    ${message.fnString}
                  } catch (error) {
                    throw error instanceof Error ? error : new Error(String(error));
                  }
                })();
              `,
              );

              await fn(context, plugmaExpect);
            } catch (error) {
              throw error instanceof Error ? error : new Error(String(error));
            }
          };

          registry.register(message.testName, testFn);

          const response = {
            type: 'TEST_ASSERTIONS',
            testRunId: (message as any).testRunId,
            assertionCode: '',
          } satisfies TestMessage;
          // logger.debug('Sending registration success:', response);
          figma.ui.postMessage(response);
        } catch (error) {
          console.error('Error registering test:', error);
          throw error;
        }
        break;
      }

      case 'RUN_TEST': {
        // logger.debug('Running test:', message.testName);
        try {
          registry
            .runTest(message.testName)
            .then((result) => {
              // logger.debug('[registry] Sending test results:', result);
              const response: TestMessage = result.error
                ? {
                    type: 'TEST_ERROR',
                    testRunId: message.testRunId,
                    error: result.error.message,
                    pluginState: result.pluginState,
                    originalError: {
                      name: result.error.name,
                      message: result.error.message,
                      stack: result.error.stack,
                    },
                  }
                : {
                    type: 'TEST_ASSERTIONS',
                    testRunId: message.testRunId,
                    assertionCode: result.assertions.join(';\n'),
                  };

              // logger.debug(`[registry] 📮 ${response.type}:`, response);
              figma.ui.postMessage(response);
            })
            .catch((error) => {
              const response = {
                type: 'TEST_ERROR',
                testRunId: message.testRunId,
                error: error instanceof Error ? error.message : String(error),
              } satisfies TestMessage;
              // logger.error('Error executing test:', error);
              figma.ui.postMessage(response);
            });
        } catch (error) {
          const response = {
            type: 'TEST_ERROR',
            testRunId: message.testRunId,
            error: error instanceof Error ? error.message : String(error),
          } satisfies TestMessage;
          // logger.error('Error executing test:', error);
          figma.ui.postMessage(response);
        }
        break;
      }
    }
  } catch (error) {
    const response = {
      type: 'TEST_ERROR',
      testRunId: (message as any).testRunId,
      error: error instanceof Error ? error.message : String(error),
    } satisfies TestMessage;
    // logger.error('Error handling message:', error);
    figma.ui.postMessage(response);
  }
}
