import WebSocket from "ws";
import type { Plugin } from "vite";

/**
 * Creates a Vite plugin that notifies via WebSocket when builds complete
 *
 * @param port - The port number to connect to
 * @returns A Vite plugin that manages WebSocket notifications
 */
export function createBuildNotifierPlugin(port: number): Plugin {
	let ws: WebSocket | null = null;
	let messageQueue: string[] = [];
	let buildId: string;
	let reconnectAttempts = 0;
	const MAX_RECONNECT_ATTEMPTS = 20;
	const RECONNECT_DELAY = 3000;

	const connectWebSocket = () => {
		if (ws) return;

		console.log("[build-notifier] Attempting to connect to WebSocket...");
		ws = new WebSocket(`ws://localhost:${port + 1}`);

		ws.on("error", (error) => {
			console.error("[build-notifier] WebSocket error:", error);
			if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
				reconnectAttempts++;
				console.log(
					`[build-notifier] Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`,
				);
				setTimeout(connectWebSocket, RECONNECT_DELAY);
			}
		});

		ws.on("open", () => {
			console.log(
				"[build-notifier] WebSocket connected, readyState:",
				ws?.readyState,
			);
			reconnectAttempts = 0;
			sendQueuedMessages();
		});

		ws.on("close", () => {
			console.log("[build-notifier] WebSocket closed");
			ws = null;
			if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
				reconnectAttempts++;
				console.log(
					`[build-notifier] Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`,
				);
				setTimeout(connectWebSocket, RECONNECT_DELAY);
			}
		});
	};

	const sendQueuedMessages = () => {
		console.log(
			"[build-notifier] Attempting to send queued messages. Queue size:",
			messageQueue.length,
		);
		while (messageQueue.length > 0 && ws?.readyState === WebSocket.OPEN) {
			const message = messageQueue.shift();
			if (message) {
				try {
					ws.send(message);
					console.log(
						"[build-notifier] Queued message sent successfully:",
						message,
					);
				} catch (error) {
					console.error(
						"[build-notifier] Failed to send queued message:",
						error,
					);
					messageQueue.unshift(message); // Put the message back at the start of the queue
					break;
				}
			}
		}
		if (messageQueue.length > 0) {
			console.log(
				"[build-notifier] Messages still in queue:",
				messageQueue.length,
			);
		}
	};

	const sendMessage = (message: string) => {
		// Parse the message to check if it's a BUILD_COMPLETE message
		const parsedMessage = JSON.parse(message);
		if (parsedMessage.pluginMessage?.type === "BUILD_COMPLETE") {
			// If this is a BUILD_COMPLETE message, remove any existing BUILD_COMPLETE messages from queue
			messageQueue = messageQueue.filter((queuedMsg) => {
				try {
					const parsed = JSON.parse(queuedMsg);
					return parsed.pluginMessage?.type !== "BUILD_COMPLETE";
				} catch {
					return true; // Keep messages that can't be parsed
				}
			});
		}

		return new Promise<void>((resolve, reject) => {
			if (!ws || ws.readyState !== WebSocket.OPEN) {
				messageQueue.push(message);
				console.log(
					`[build-notifier] Message queued (WebSocket ${ws ? "state: " + ws.readyState : "is null"})`,
				);
				resolve();
				return;
			}

			try {
				ws.send(message);
				console.log("[build-notifier] Message sent directly:", message);
				resolve();
			} catch (error) {
				console.error(
					"[build-notifier] Failed to send message:",
					error,
				);
				messageQueue.push(message);
				reject(error);
			}
		});
	};

	return {
		name: "build-notifier",
		buildStart() {
			connectWebSocket();
		},
		async handleHotUpdate({ file }) {
			// Add a small delay to ensure client has received the update
			// TODO: May need a better way to handle this. Maybe receving buildId from client?
			await new Promise((resolve) => setTimeout(resolve, 100));

			const message = JSON.stringify({
				pluginMessage: {
					type: "BUILD_COMPLETE" as const,
					buildId: Date.now().toString(),
					source: "vite",
					file,
				},
				pluginId: "*",
			});

			await sendMessage(message);
		},
		// closeBundle() {
		// 	// Send final build complete message
		// 	const message = JSON.stringify({
		// 		pluginMessage: {
		// 			type: "BUILD_COMPLETE" as const,
		// 			buildId,
		// 			source: "vite",
		// 			file: null,
		// 		},
		// 		pluginId: "*",
		// 	});

		// 	if (ws?.readyState === WebSocket.OPEN) {
		// 		ws.send(message);
		// 		console.log("[build-notifier] Build complete message sent");
		// 	} else {
		// 		messageQueue.push(message);
		// 		console.log("[build-notifier] Build complete message queued");
		// 	}
		// },
		buildEnd() {
			// Don't close the WebSocket connection immediately
			// Let it handle any queued messages first
			console.log(
				"[build-notifier] Build ending, queue size:",
				messageQueue.length,
			);
			if (messageQueue.length === 0 && ws) {
				console.log("[build-notifier] Closing WebSocket connection");
				ws.close();
				ws = null;
			} else {
				console.log(
					"[build-notifier] Keeping connection open for queued messages",
				);
			}
		},
	};
}
