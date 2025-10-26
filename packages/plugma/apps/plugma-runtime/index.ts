/**
 * PLUGMA RUNTIME
 * This module is injected at the top of the plugin's main file.
 * It provides runtime functionality like window management and event handling.
 *
 * @remarks
 * This code runs in the Figma plugin environment and provides:
 * - Window management (size, position, persistence)
 * - Command history tracking
 * - UI state management
 * - Safe Figma API access
 */

import {
	handleDeleteClientStorage,
	handleDeleteRootPluginData,
	handleHideToolbar,
	handleMaximizeWindow,
	handleMinimizeWindow,
	handleSaveWindowSettings,
} from './handlers/index.js'

import type { PlugmaRuntimeData } from '../shared/types.js'

// NOTE: the comment must come after the declare stmt
// otherwise tsc will remove it
export declare const runtimeData: PlugmaRuntimeData

/**
 * Global runtime data
 * Vite will inject the runtimeData object below
 * DO NOT REMOVE THE COMMENT BELOW! IT IS A VITE INJECTION POINT
 */
/*--[ RUNTIME_DATA ]--*/

export * from './figma-api-interceptors'

/**
 * Map of event handlers for window management
 */
const windowHandlers = {
	[handleMinimizeWindow.EVENT_NAME]: handleMinimizeWindow,
	[handleMaximizeWindow.EVENT_NAME]: handleMaximizeWindow,
	[handleHideToolbar.EVENT_NAME]: handleHideToolbar,
	[handleSaveWindowSettings.EVENT_NAME]: handleSaveWindowSettings,
	[handleDeleteRootPluginData.EVENT_NAME]: handleDeleteRootPluginData,
	[handleDeleteClientStorage.EVENT_NAME]: handleDeleteClientStorage,
} as const

// // Import test message handlers
// Test handlers need to initialize before tests, but importing them here means they will appear after the tests have been registered.
// import { initializeTestHandlers } from '../../src/testing/figma/handlers'

// initializeTestHandlers()

// Set up message listener for window management
figma.ui.on('message', async (msg) => {
	const handler = windowHandlers[msg.event as keyof typeof windowHandlers]
	if (handler) {
		await Promise.resolve(handler(msg))
	}
})
