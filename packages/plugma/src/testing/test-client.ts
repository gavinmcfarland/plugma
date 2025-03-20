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
	private pendingMessages: Array<{
		message: TestMessage;
		resolve: (value: void) => void;
		reject: (error: Error) => void;
	}> = [];
	private testRunCallbacks = new Map<
		string,
		{
			resolve: (value: TestResultMessage) => void;
			reject: (error: Error) => void;
		}
	>();
	private closed = false;
	private connecting = false;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private isReconnecting = false;

	private constructor(
		url = "ws://localhost",
		port: number,
		options: { debug?: boolean } = {},
	) {
		this.url = `${url}:${port}`;
		this.logger = new Logger({ debug: true });
	}

	/**
	 * Gets the singleton instance of TestClient
	 * @throws {Error} If attempting to get instance before initialization
	 */
	public static getInstance(
		options = { port: undefined, debug: undefined } as {
			port?: number;
			debug?: boolean;
		},
		url?: string,
	): TestClient {
		if (!TestClient.instance || TestClient.instance.closed) {
			// Try to get port from environment variable if not provided
			const envPort = process.env.TEST_WS_PORT;
			const finalPort = options.port || (envPort ? Number(envPort) : 9001);

			TestClient.instance = new TestClient(url, finalPort, {
				debug: options.debug,
			});
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

		// If already attempting to connect, wait for that attempt
		if (this.connecting) {
			return new Promise((resolve, reject) => {
				const checkConnection = setInterval(() => {
					if (this.ws?.readyState === WebSocket.OPEN) {
						clearInterval(checkConnection);
						resolve(this.ws);
					} else if (!this.connecting) {
						clearInterval(checkConnection);
						reject(new Error("Connection failed"));
					}
				}, 100);
			});
		}

		this.connecting = true;

		// Close existing connection if any
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		return new Promise((resolve, reject) => {
			const attemptConnection = () => {
				this.logger.debug("Connecting to:", this.url);
				this.ws = new WebSocket(`${this.url}?source=test`);

				if (!this.ws) return reject(new Error("WebSocket not initialized"));

				const errorHandler = (error: Event) => {
					this.logger.error("Connection error:", error);
					this.ws = null;
					this.connecting = false;

					// Start reconnection attempt if not already reconnecting
					if (!this.isReconnecting && !this.closed) {
						this.isReconnecting = true;
						this.reconnectTimer = setTimeout(() => {
							this.isReconnecting = false;
							attemptConnection();
						}, WS_CONFIG.retryDelay);
					}
				};

				this.ws.onopen = () => {
					this.logger.debug("Connection established");
					if (this.ws) {
						this.ws.onerror = errorHandler;
						this.setupMessageHandler();
						this.connecting = false;
						this.isReconnecting = false;
						if (this.reconnectTimer) {
							clearTimeout(this.reconnectTimer);
							this.reconnectTimer = null;
						}
						this.processPendingMessages(); // Process any queued messages
						resolve(this.ws);
					}
				};

				this.ws.onerror = errorHandler;

				this.ws.onclose = () => {
					this.logger.debug("Connection closed");
					this.ws = null;
					this.connecting = false;

					// Start reconnection attempt if not already reconnecting
					if (!this.isReconnecting && !this.closed) {
						this.isReconnecting = true;
						this.reconnectTimer = setTimeout(() => {
							this.isReconnecting = false;
							attemptConnection();
						}, WS_CONFIG.retryDelay);
					}

					// Don't reject pending promises, keep them queued
					if (this.closed) {
						this.rejectPendingPromises(new Error("WebSocket closed"));
					}
				};
			};

			attemptConnection();
		});
	}

	/**
	 * Processes any pending messages in the queue
	 */
	private async processPendingMessages(): Promise<void> {
		while (this.pendingMessages.length > 0) {
			const pending = this.pendingMessages.shift();
			if (pending) {
				try {
					await this.send(pending.message);
					pending.resolve();
				} catch (error) {
					pending.reject(error as Error);
				}
			}
		}
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

				// this.logger.debug("[ws-client] 📩", JSON.stringify(message, null, 2));

				if (
					message.type === "TEST_ASSERTIONS" ||
					message.type === "TEST_ERROR"
				) {
					const callbacks = this.testRunCallbacks.get(message.testRunId);
					if (callbacks) {
						// this.logger.debug(
						// 	"[ws-client] Found callbacks for testRunId:",
						// 	message.testRunId,
						// );
						this.testRunCallbacks.delete(message.testRunId);
						callbacks.resolve(message);
					} else {
						// this.logger.warn(
						// 	"[ws-client] No callbacks found for testRunId:",
						// 	message.testRunId,
						// );
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
	 * Sends a message to the WebSocket server or queues it if not connected
	 * @throws {Error} If connection fails or times out
	 */
	public async send(message: TestMessage): Promise<void> {
		// Queue all messages when not connected or closed
		if (this.closed) {
			throw new Error("WebSocket closed");
		}

		try {
			const ws = await this.ensureConnection();

			if (ws.readyState !== WebSocket.OPEN) {
				throw new Error("WebSocket not connected");
			}

			return new Promise((resolve, reject) => {
				const testRunId =
					"testRunId" in message ? message.testRunId : message.type;
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
		} catch (error) {
			// Queue the message for retry when connection is restored
			return new Promise((resolve, reject) => {
				this.pendingMessages.push({ message, resolve, reject });
			});
		}
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
		await this.processPendingMessages();
	}

	/**
	 * Closes the WebSocket connection
	 */
	public close(): void {
		this.closed = true;
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.rejectPendingPromises(new Error("WebSocket closed"));
	}
}
