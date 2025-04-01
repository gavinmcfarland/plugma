import { decodeMessage } from "./decodeMessage";

export function addMessageListener(
	{
		client,
		enableWebSocket,
	}: {
		client: any;
		enableWebSocket: boolean;
	},
	via: string,
	callback: (event: MessageEvent) => void,
) {
	if (via === "window") {
		window.addEventListener("message", callback);
	} else if (via === "parent" && window.parent) {
		window.addEventListener("message", (event) => {
			if (event.source === window.parent) {
				callback(event);
			}
		});
	} else if (via === "ws" && enableWebSocket) {
		client.onAny((event) => {
			try {
				const parsedData = decodeMessage(event.data);
				const newEvent = { ...event, data: parsedData };
				callback(newEvent);
			} catch (error) {
				console.error("Failed to parse WebSocket message data:", error);
				callback(event);
			}
		});
	} else {
		// console.warn(`Cannot add message listener via ${via}.`)
	}
}
