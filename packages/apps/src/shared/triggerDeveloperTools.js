import { isDeveloperToolsActive, pluginWindowSettings } from "./stores"
import { get } from "svelte/store"

function savePluginWindowSettings(devToolsActive) {
	let $pluginWindowSettings = get(pluginWindowSettings)

	$pluginWindowSettings.toolbarEnabled = !devToolsActive
	isDeveloperToolsActive.set(!devToolsActive)

	parent.postMessage(
		{
			pluginMessage: { event: 'PLUGMA_SAVE_PLUGIN_WINDOW_SETTINGS', data: $pluginWindowSettings },
			pluginId: '*',
		},
		'*',
	)
}

export async function triggerDeveloperTools() {

	let devToolsActive = false;

	// Subscribe to the store to keep the local variable updated
	isDeveloperToolsActive.subscribe((value) => {
		devToolsActive = value;
	});

	window.addEventListener('message', (event) => {

		let message = event.data?.pluginMessage

		if (message.event === "PLUGMA_PLUGIN_WINDOW_TOGGLE_TOOLBAR") {
			savePluginWindowSettings(devToolsActive)
		}

	})

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
			savePluginWindowSettings(devToolsActive)
		}
	})
}
