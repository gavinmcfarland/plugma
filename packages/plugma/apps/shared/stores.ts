import { writable } from "svelte/store";

// @ts-ignore
import { createClient } from "plugma/client";

// Store to track whether the local client is connected
export const localClientConnected = writable(false);
export let localClientId = writable(false);

// Store to track remote clients that are connected
export const remoteClients = writable([]);
export const pluginWindowClients = writable([]);
export const isDeveloperToolsActive = writable(false);
export const isLocalhostWithoutPort = writable(false);
export const pluginWindowSettings = writable({});

export const devServerIframe = writable<HTMLIFrameElement | null>(null);

export const wsClientStore = writable<any>(null);

export function initializeWsClient(room: string, port: number) {
	port = Number(port + 1);
	console.log("initializing ws client", room, port);
	const wsClient = createClient({
		room,
		port,
	});
	wsClientStore.set(wsClient);
	return wsClient;
}
