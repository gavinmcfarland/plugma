import { addMessageListener } from "../../shared/lib/addMessageListener";

export function overrideMessageEvent() {
	const isInsideIframe = window.self !== window.top;
	const isInsideFigma = typeof figma !== "undefined";

	if (!(isInsideIframe || isInsideFigma)) {
		let originalAddEventListener = window.addEventListener;
		let originalOnMessageHandler: any = null;
		let messageListeners: any[] = [];

		// Override addEventListener for 'message' events
		window.addEventListener = function (type, listener, options) {
			if (type === "message") {
				messageListeners.push(listener); // Store the listener
			} else {
				originalAddEventListener.call(window, type, listener, options);
			}
		};

		// Function to trigger all stored message listeners
		function triggerMessageListeners(event) {
			messageListeners.forEach((listener) => {
				try {
					listener(event); // Call each listener
				} catch (err) {
					console.error("Error in message listener:", err);
				}
			});
		}

		// Intercept WebSocket messages and pass them to the stored message listeners
		addMessageListener(
			{ client, enableWebSocket: window.runtimeData.websockets },
			["ws"],
			(event) => {
				// Trigger all registered message listeners
				triggerMessageListeners(event);
			},
		);

		// Override window.onmessage using Object.defineProperty
		Object.defineProperty(window, "onmessage", {
			get: function () {
				return originalOnMessageHandler;
			},
			set: function (handler) {
				originalOnMessageHandler = handler;
				// Ensure WebSocket's onmessage works with the new handler
				addMessageListener(
					{
						client,
						enableWebSocket: window.runtimeData.websockets,
					},
					["ws"],
					(event) => {
						// Trigger the new handler
						if (originalOnMessageHandler) {
							originalOnMessageHandler(event);
						}

						// Also trigger all stored listeners
						triggerMessageListeners(event);
					},
				);
			},
		});
	}
}
