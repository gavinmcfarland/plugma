/**
 * WebSocket client for test communication
 * Handles communication between Node test runner and Figma plugin
 */

import { Logger } from "#utils/log/logger.js";
import type { TestMessage, TestResultMessage } from "./types.js";

declare global {
	var testWs: WebSocket | undefined;
}

/**
 * Configuration for WebSocket client
 */
const WS_CONFIG = {
	timeout: 30000, // 30 seconds
	retryDelay: 1000, // 1 second
} as const;

/**
 * Error class for WebSocket timeouts
 */
class WebSocketTimeoutError extends Error {
	constructor() {
		super("WebSocket request timed out");
		this.name = "WebSocketTimeoutError";
	}
}

/**
 * WebSocket client for test communication with Figma
 * Handles connection management and message passing
 */
export class TestClient {
	private static instance: TestClient | null = null;
	private ws: WebSocket | null = null;
	private readonly url: string;
	private readonly logger: Logger;
	private messageQueue: Array<{
		resolve: () => void;
		reject: (error: Error) => void;
		testRunId: string;
		timeoutId: ReturnType<typeof setTimeout>;
	}> = [];
	private testRunCallbacks = new Map<
		string,
		{
			resolve: (value: TestResultMessage) => void;
			reject: (error: Error) => void;
		}
	>();
	private closed = false;

	private constructor(url = "ws://localhost:9001") {
		this.url = url;
		this.logger = new Logger({ debug: true });
	}

	/**
	 * Gets the singleton instance of TestClient
	 */
	public static getInstance(url?: string): TestClient {
		if (!TestClient.instance || TestClient.instance.closed) {
			TestClient.instance = new TestClient(url);
		}
		return TestClient.instance;
	}

	/**
	 * Ensures WebSocket connection is established
	 * @throws {Error} If connection fails
	 */
	private async ensureConnection(): Promise<WebSocket> {
		if (this.closed) {
			throw new Error("WebSocket closed");
		}

		if (this.ws?.readyState === WebSocket.OPEN) {
			return this.ws;
		}

		// Close existing connection if any
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		this.logger.debug("Connecting to:", this.url);
		this.ws = new WebSocket(`${this.url}?source=test`);

		return new Promise((resolve, reject) => {
			if (!this.ws) return reject(new Error("WebSocket not initialized"));

			const errorHandler = (error: Event) => {
				this.logger.error("Connection error:", error);
				this.ws = null;
				reject(new Error("Connection failed"));
			};

			this.ws.onopen = () => {
				this.logger.debug("Connection established");
				if (this.ws) {
					this.ws.onerror = errorHandler;
					this.setupMessageHandler();
					resolve(this.ws);
				}
			};

			this.ws.onerror = errorHandler;

			this.ws.onclose = () => {
				this.logger.debug("Connection closed");
				this.ws = null;
				// Reject any pending promises when connection is closed
				this.rejectPendingPromises(new Error("WebSocket closed"));
			};
		});
	}

	/**
	 * Sets up message handler for WebSocket
	 */
	private setupMessageHandler(): void {
		if (!this.ws) return;

		this.ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				const message = data.pluginMessage as TestMessage;

				this.logger.debug("[ws-client] 📩", JSON.stringify(message, null, 2));

				if (
					message.type === "TEST_ASSERTIONS" ||
					message.type === "TEST_ERROR"
				) {
					const callbacks = this.testRunCallbacks.get(message.testRunId);
					if (callbacks) {
						this.logger.debug(
							"[ws-client] Found callbacks for testRunId:",
							message.testRunId,
						);
						this.testRunCallbacks.delete(message.testRunId);
						callbacks.resolve(message);
					} else {
						this.logger.warn(
							"[ws-client] No callbacks found for testRunId:",
							message.testRunId,
						);
					}
				}

				if ("testRunId" in message) {
					// Also resolve the original send promise
					const index = this.messageQueue.findIndex(
						(item) => item.testRunId === message.testRunId,
					);
					if (index !== -1) {
						const { resolve, timeoutId } = this.messageQueue[index];
						clearTimeout(timeoutId);
						this.messageQueue.splice(index, 1);
						resolve();
					}
				}
			} catch (error) {
				this.logger.error("[ws-client] Error handling message:", error);
				this.logger.error("[ws-client] Raw message:", event.data);
			}
		};
	}

	/**
	 * Rejects all pending promises with the given error
	 */
	private rejectPendingPromises(error: Error): void {
		for (const { reject, timeoutId } of this.messageQueue) {
			clearTimeout(timeoutId);
			reject(error);
		}
		this.messageQueue.length = 0;
	}

	/**
	 * Sends a message to the WebSocket server
	 * @throws {Error} If connection fails or times out
	 */
	public async send(message: TestMessage): Promise<void> {
		const ws = await this.ensureConnection();
		const testRunId = "testRunId" in message ? message.testRunId : message.type;

		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				const index = this.messageQueue.findIndex(
					(item) => item.testRunId === testRunId,
				);
				if (index !== -1) {
					this.messageQueue.splice(index, 1);
				}
				reject(new WebSocketTimeoutError());
			}, WS_CONFIG.timeout);

			this.messageQueue.push({
				resolve,
				reject,
				testRunId,
				timeoutId,
			});

			try {
				ws.send(
					JSON.stringify({
						pluginMessage: message,
						pluginId: "*",
					}),
				);
			} catch (error) {
				clearTimeout(timeoutId);
				this.messageQueue.pop();
				throw error;
			}
		});
	}

	/**
	 * Waits for a test result message
	 */
	public waitForTestResult(testRunId: string): Promise<TestResultMessage> {
		return new Promise((resolve, reject) => {
			this.testRunCallbacks.set(testRunId, { resolve, reject });
		});
	}

	/**
	 * Connects to the WebSocket server
	 */
	public async connect(): Promise<void> {
		this.closed = false;
		await this.ensureConnection();
	}

	/**
	 * Closes the WebSocket connection
	 */
	public close(): void {
		this.closed = true;
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.rejectPendingPromises(new Error("WebSocket closed"));
	}
}

// Export singleton instance
export const testClient = TestClient.getInstance();
