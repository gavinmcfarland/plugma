import { writable } from 'svelte/store'

// @ts-ignore
import { createClient } from 'plugma/client'

// Store to track whether the local client is connected
export const localClientConnected = writable(false)
export let localClientId = writable(false)

// Store to track remote clients that are connected
export const remoteClients = writable([])
export const pluginWindowClients = writable([])
export const isDeveloperToolsActive = writable(false)

export const isLocalhostWithoutPort = writable(false) // Doesn't use a wildcard for the allowedDevDomain dev server

export const pluginWindowSettings = writable<PluginWindowSettings>({})
interface PluginWindowSettings {
	toolbarEnabled?: boolean
	width?: number
	height?: number
}

export const devServerIframe = writable<HTMLIFrameElement | null>(null)

export const wsClientStore = writable<any>(null)

export const wsEnabled = writable<boolean>(false)
export const htmlStore = writable<HTMLDocument | null>(null)
export const isBrowserConnected = writable<boolean>(false)

export function initializeWsClient(room: string, port: number) {
	port = Number(port + 1)
	const wsClient = createClient({
		url: 'ws://localhost',
		room,
		port,
		serverOptions: {
			path: '/',
			transports: ['websocket'],
		},
	})
	wsClientStore.set(wsClient)
	return wsClient
}
