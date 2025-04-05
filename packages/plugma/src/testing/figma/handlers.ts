import type { TestContext, TestMessage } from '#testing/types'
import { expect as plugmaExpect } from './expect'
import { registry } from './registry'

/**
 * Handles test execution messages in the Figma plugin environment
 * @param message - The message received from the test runner
 */

export function handleTestMessage(message: TestMessage): void {
	// console.log("📨 Received message:", message);
	try {
		switch (message.type) {
			case 'REGISTER_TEST': {
				console.log('🔄 Registering test:', message.data.testName)
				try {
					// Create test function from string representation
					const testFn = async (context: TestContext, expect: typeof plugmaExpect) => {
						try {
							const fn = new Function(
								'context',
								'plugmaExpect',
								`
                return (async () => {
                  try {
                    ${message.data.fnString}
                  } catch (error) {
                    throw error instanceof Error ? error : new Error(String(error));
                  }
                })();
              `,
							)

							await fn(context, plugmaExpect)
						} catch (error) {
							throw error instanceof Error ? error : new Error(String(error))
						}
					}

					registry.register(message.data.testName, testFn)

					const response = {
						type: 'TEST_ASSERTIONS',
						data: {
							testRunId: (message as any).testRunId,
							assertionCode: '',
							from: 'figma',
						},
					} satisfies TestMessage
					console.log('✅ Registration success:', response)
					figma.ui.postMessage(response)
				} catch (error) {
					console.error('❌ Error registering test:', error)
					throw error
				}
				break
			}

			case 'RUN_TEST': {
				console.log('▶️ Running test:', message.data.testName)
				try {
					registry
						.runTest(message.data.testName)
						.then((result) => {
							console.log('📊 Test results:', result)
							const response: TestMessage = result.error
								? {
										type: 'TEST_ERROR',
										data: {
											room: 'test',
											testRunId: message.data.testRunId,
											error: result.error.message,
											pluginState: result.pluginState,
											originalError: {
												name: result.error.name,
												message: result.error.message,
												stack: result.error.stack,
											},
										},
									}
								: {
										type: 'TEST_ASSERTIONS',
										data: {
											room: 'test',
											testRunId: message.data.testRunId,
											assertionCode: result.assertions.join(';\n'),
										},
									}

							// console.log(
							// 	`📮 Sending ${response.type}:`,
							// 	response,
							// );
							figma.ui.postMessage(response)
						})
						.catch((error) => {
							const response = {
								type: 'TEST_ERROR',
								data: {
									testRunId: message.data.testRunId,
									error: error instanceof Error ? error.message : String(error),
									from: 'figma',
								},
							} satisfies TestMessage
							// console.error("❌ Error executing test:", error);
							figma.ui.postMessage(response)
						})
				} catch (error) {
					const response = {
						type: 'TEST_ERROR',
						data: {
							testRunId: message.data.testRunId,
							error: error instanceof Error ? error.message : String(error),
							from: 'figma',
						},
					} satisfies TestMessage
					// console.error("❌ Error executing test:", error);
					figma.ui.postMessage(response)
				}
				break
			}
		}
	} catch (error) {
		const response = {
			type: 'TEST_ERROR',
			data: {
				testRunId: (message as any).testRunId,
				error: error instanceof Error ? error.message : String(error),
				from: 'figma',
			},
		} satisfies TestMessage
		// console.error("❌ Error handling message:", error);
		figma.ui.postMessage(response)
	}
}

figma.ui.on('message', async (message) => {
	handleTestMessage(message)
})
