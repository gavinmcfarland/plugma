import { decodeMessage } from "./decodeMessage";
import { wsEnabled, wsClientStore } from "../stores";
import { get } from "svelte/store";

export function addMessageListener(
	via: string,
	callback: (event: MessageEvent) => void,
) {
	const enableWebSocket = get(wsEnabled);
	const socket = get(wsClientStore);
	if (via === "window") {
		window.addEventListener("message", callback);
	} else if (via === "parent" && window.parent) {
		window.addEventListener("message", (event) => {
			if (event.source === window.parent) {
				callback(event);
			}
		});
	} else if (via === "ws" && enableWebSocket) {
		socket.onAny((event: any) => {
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
