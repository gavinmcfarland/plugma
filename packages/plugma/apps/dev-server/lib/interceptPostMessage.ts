import { postMessageVia } from "../../shared/lib/postMessageVia";

export function interceptPostMessage() {
	const isInsideIframe = window.self !== window.top;
	const isInsideFigma = typeof figma !== "undefined";

	// Override postMessage if not inside iframe or Figma
	if (!(isInsideIframe || isInsideFigma)) {
		// Store the original postMessage function
		const originalPostMessage = window.postMessage;

		window.postMessage = function (message, targetOrigin, transfer) {
			// console.log('intercept message', message)
			// Intercept and log the message
			// let messageId = nanoid()
			// Check if this message has already been processed
			// if (!processedMessages.has(messageId)) {
			// processedMessages.add(messageId)

			postMessageVia(
				{
					iframeTarget: iframe,
					client,
					enableWebSocket: window.runtimeData.websockets,
				},
				["ws"],
				message,
			);
			// }

			return null;
			// // Call the original postMessage to maintain functionality
			// originalPostMessage.call(window, message, targetOrigin, transfer)
		};
	}
}
