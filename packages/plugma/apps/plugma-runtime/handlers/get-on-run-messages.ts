import type { PluginMessage } from '../../shared/types.js'

/**
 * Retrieves and posts all saved on-run messages to the UI.
 */
export async function handleGetOnRunMessages(_msg: PluginMessage): Promise<void> {
	const data = (await figma.clientStorage.getAsync('plugma-on-run-messages')) as Array<{
		pluginMessage: unknown
	}>

	for (const msg of data) {
		figma.ui.postMessage(msg.pluginMessage)
	}
}

handleGetOnRunMessages.EVENT_NAME = 'PLUGMA_GET_ON_RUN_MESSAGES' as const
