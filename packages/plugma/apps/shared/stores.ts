import { writable } from "svelte/store";

// Store to track whether the local client is connected
export const localClientConnected = writable(false);
export let localClientId = writable(false);

// Store to track remote clients that are connected
export const remoteClients = writable([]);
export const pluginWindowClients = writable([]);
export const isDeveloperToolsActive = writable(false);
export const isLocalhostWithoutPort = writable(false);
export const pluginWindowSettings = writable({});
