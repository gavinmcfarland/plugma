import { get } from 'svelte/store'
import { isDeveloperToolsActive, pluginWindowSettings } from '../stores'
import { writable } from 'svelte/store'

/**
 * Toggles the developer toolbar via keyboard shortcut (Cmd/Ctrl + Option + J) or iframe messages.
 * Handles communication between iframe and parent window for toolbar state changes.
 */
export async function triggerDeveloperTools() {
	let devToolsActive = false

	// Subscribe to the store to keep the local variable updated
	isDeveloperToolsActive.subscribe((value) => {
		devToolsActive = value
	})

	// If user toggles toolbar from iframe, send message to parent
	window.addEventListener('message', (event) => {
		const message = event.data?.pluginMessage

		if (message.event === 'PLUGMA_PLUGIN_WINDOW_TOGGLE_TOOLBAR') {
			saveFigmaBridgeSettings(devToolsActive, true)
		}
	})

	// If user toggles from outside iframe, listen for the keyboard shortcut
	document.addEventListener('keydown', (event) => {
		// Check if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
		const isCmdOrCtrl = event.metaKey || event.ctrlKey
		// Check if Option (Alt) key is pressed
		const isOption = event.altKey
		// Check if Shift key is pressed
		const isShift = event.shiftKey
		// Check if the key code corresponds to 'D'
		const isJKey = event.code === 'KeyJ'

		// If all these modifiers and the D key are pressed
		if (isCmdOrCtrl && isOption && isJKey) {
			event.preventDefault()

			parent.postMessage(
				{
					pluginMessage: { event: 'PLUGMA_PLUGIN_WINDOW_TOGGLE_TOOLBAR' },
					pluginId: '*',
				},
				'*',
			)
			// FIXME: Is this needed?
			saveFigmaBridgeSettings(devToolsActive)
		}
	})
}

function saveFigmaBridgeSettings(devToolsActive: boolean, getWindowSize?: boolean) {
	if (getWindowSize) {
		const $pluginWindowSettings = get(pluginWindowSettings)
		$pluginWindowSettings.toolbarEnabled = !devToolsActive

		isDeveloperToolsActive.set(!devToolsActive)

		pluginWindowSettings.set({
			...$pluginWindowSettings,
			width: window.innerWidth,
			height: window.innerHeight,
		})

		console.log('pluginWindowSettings', window.innerHeight)
		parent.postMessage(
			{
				pluginMessage: {
					event: 'PLUGMA_SAVE_PLUGIN_WINDOW_SETTINGS',
					data: {
						...$pluginWindowSettings,
						width: window.innerWidth,
						height: window.innerHeight,
					},
				},
				pluginId: '*',
			},
			'*',
		)
	}
}
