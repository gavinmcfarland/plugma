import { createClient, type SocketClient } from '../core/websockets/client.js'

/**
 * WebSocket client for test communication with Figma
 * Handles connection management and message passing
 */
export class TestClient {
	private static instance: SocketClient

	private static initSocket(port?: number) {
		// Try to get port from environment variable if not provided
		const envPort = process.env.PORT
		const finalPort = port || (envPort ? Number(envPort) : 9001)

		console.log('Create client', finalPort + 1)

		return createClient({
			room: 'test',
			url: 'ws://localhost',
			port: finalPort + 1,
		})
	}

	/**
	 * Gets the singleton instance of TestClient
	 * @param port Optional port number for initial connection
	 * @throws {Error} If attempting to get instance with different port than initial creation
	 */
	public static async getInstance(port?: number): Promise<SocketClient> {
		if (!TestClient.instance) {
			TestClient.instance = TestClient.initSocket(port)

			const runTest = (triggerSource: string, data?: unknown) => {
				console.log('emitting RUN_TEST')
				TestClient.instance.emit('RUN_TEST', {
					testName: 'test',
					testRunId: `${Date.now()}`,
					room: 'figma',
				})
				console.log('RUN_TEST sent via', triggerSource, data)
			}

			// TODO: Consider whether there should be an event that triggers this
			runTest('initial trigger')

			TestClient.instance.on('BUILD_STARTED', (data) => runTest('build started', data))
			TestClient.instance.on('FILE_CHANGED', (file) => runTest('file changed', file))

			return TestClient.instance
		}

		if (port !== undefined) {
			throw new Error('TestClient instance already exists. Cannot create new instance with different port.')
		}

		return TestClient.instance
	}
}
