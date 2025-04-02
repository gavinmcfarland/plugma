import type { PlugmaCommand, PlugmaRuntimeData } from '#core/types.js'

export type { PlugmaRuntimeData }

/**
 * Interface for window settings that can be persisted
 */
export interface WindowSettings {
	width: number
	height: number
	shouldPersist?: boolean
	minimized: boolean
	toolbarEnabled: boolean
	position?: {
		x: number
		y: number
	}
}

export interface CommandHistory {
	previousCommand: PlugmaCommand | null
	previousInstanceId: string | null
}

export interface ShowUIOptions extends WindowSettings {
	visible?: boolean
} /**
 * Storage key for window settings in Figma's client storage
 */

export const WINDOW_SETTINGS_KEY = 'PLUGMA_PLUGIN_WINDOW_SETTINGS' as const /**
 * Base type for all plugin messages
 */
export interface PluginMessage {
	event: string
	data?: unknown
	pluginMessage?: unknown
}
/**
 * Type for message handlers with their event names
 */

export interface MessageHandler {
	(msg: PluginMessage): Promise<void> | void
	EVENT_NAME: string
}
/**
 * Registry to ensure event name uniqueness across listeners
 */

export type EventRegistry = {
	[K in string]: MessageHandler
}

interface Manifest {
	networkAccess: {
		devAllowedDomains: string[]
	}
}

export interface RuntimeData {
	manifest: Manifest
	websockets: boolean
	port: number
}

declare global {
	interface Window {
		runtimeData: RuntimeData
	}
}
