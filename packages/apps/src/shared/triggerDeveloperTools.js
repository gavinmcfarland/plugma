import { isDeveloperToolsActive } from "./stores"
import { get } from "svelte/store"

export function triggerDeveloperTools() {

	// if (window.runtimeData.command === "preview") {
	// 	isDeveloperToolsActive.set(true)
	// }

	// window.addEventListener('message', (event) => {
	// 	let message = event.data?.pluginMessage

	// 	if (message.event === "PLUGMA_HIDE_TOOLBAR") {
	// 		isDeveloperToolsActive.set(false)
	// 	}
	// 	if (message.event === "PLUGMA_SHOW_TOOLBAR") {
	// 		isDeveloperToolsActive.set(true)
	// 	}
	// })

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
			event.preventDefault() // Prevent the default action if needed
			// Add your custom functionality here
			let devToolsActive = get(isDeveloperToolsActive)
			isDeveloperToolsActive.set(!devToolsActive)

			if (!devToolsActive) {
				parent.postMessage(
					{
						pluginMessage: { event: 'PLUGMA_INCREASE_WINDOW_HEIGHT', toolbarHeight: 40 },
						pluginId: '*',
					},
					'*',
				)
				parent.postMessage(
					{
						pluginMessage: { event: 'PLUGMA_SHOW_TOOLBAR' },
						pluginId: '*',
					},
					'*',
				)
			}
			else {
				parent.postMessage(
					{
						pluginMessage: { event: 'PLUGMA_DECREASE_WINDOW_HEIGHT', toolbarHeight: 40 },
						pluginId: '*',
					},
					'*',
				)
				parent.postMessage(
					{
						pluginMessage: { event: 'PLUGMA_HIDE_TOOLBAR' },
						pluginId: '*',
					},
					'*',
				)
			}

		}
	})
}
