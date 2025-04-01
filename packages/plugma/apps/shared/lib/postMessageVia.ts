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
	via: string,
	message: any,
) {
	// logger.info(`--- ws post, ${via}`, message);
	if (
		via === "iframe" &&
		iframeTarget &&
		iframeTarget.contentWindow.postMessage
	) {
		iframeTarget.contentWindow.postMessage(message, "*");
	} else if (via === "parent" && window.parent) {
		window.parent.postMessage(message, "*");
	} else if (via === "ws") {
		if (enableWebSocket) {
			if (!client || client.readyState !== WebSocket.OPEN) {
				// console.warn('WebSocket is disabled or not open, queuing message:', message)
				messageQueue.push({ message, via });
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
		console.warn(`Cannot send message via ${via}.`);
	}
}
