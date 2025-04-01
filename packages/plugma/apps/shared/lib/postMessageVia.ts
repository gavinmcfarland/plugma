import { encodeMessage } from "./encodeMessage";

const messageQueue: any[] = [];

export function postMessageVia(
	{
		iframeTarget,
		client,
		enableWebSocket,
	}: {
		iframeTarget: any;
		client: any;
		enableWebSocket: boolean;
	},
	via: string | string[],
	message: any,
) {
	// Convert single string to array for consistent handling
	const viaMethods = Array.isArray(via) ? via : [via];

	for (const method of viaMethods) {
		if (
			method === "iframe" &&
			iframeTarget &&
			iframeTarget.contentWindow.postMessage
		) {
			iframeTarget.contentWindow.postMessage(message, "*");
		} else if (method === "parent" && window.parent) {
			window.parent.postMessage(message, "*");
		} else if (method === "ws") {
			if (enableWebSocket) {
				if (!client || client.readyState !== WebSocket.OPEN) {
					// console.warn('WebSocket is disabled or not open, queuing message:', message)
					messageQueue.push({ message, via: method });
				} else {
					try {
						const encodedMessage = encodeMessage(message);
						// ws.send(encodedMessage);
						client.sendAny(encodedMessage);
					} catch (error) {
						console.log("1", error);
					}
				}
			}
		} else {
			console.warn(`Cannot send message via ${method}.`);
		}
	}
}
