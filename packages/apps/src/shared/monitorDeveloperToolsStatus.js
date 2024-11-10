import { isDeveloperToolsActive, pluginWindowSettings } from "./stores"

export async function monitorDeveloperToolsStatus() {
	return new Promise((resolve) => {
		window.addEventListener('message', async (event) => {
			let message = event.data?.pluginMessage

			if (message?.event === 'PLUGMA_PLUGIN_WINDOW_SETTINGS') {
				console.log('plugin window settings on load', message.data)
				pluginWindowSettings.set(message.data)
				isDeveloperToolsActive.set(message.data.toolbarEnabled)
				resolve(true)
			}
		})
	})
}
