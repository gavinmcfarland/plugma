import { isDeveloperToolsActive, pluginWindowSettings } from '../../shared/stores'

/**
 * Listens for a message with type PLUGMA_PLUGIN_WINDOW_SETTINGS from the iframe to toggle developer tool bar as well as set the data for the plugin window settings.
 */

export async function monitorDeveloperToolsStatus() {
	return new Promise((resolve) => {
		window.addEventListener('message', async (event) => {
			const message = event.data?.pluginMessage

			if (message?.event === 'PLUGMA_PLUGIN_WINDOW_SETTINGS') {
				pluginWindowSettings.set(message.data)
				isDeveloperToolsActive.set(message.data.toolbarEnabled)
				resolve(true)
			}
		})
	})
}
