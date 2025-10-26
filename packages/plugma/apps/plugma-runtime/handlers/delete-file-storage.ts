import type { PluginMessage } from '../../shared/types.js'

/**
 * Deletes all plugin data stored in the root node.
 * Notifies the user when the operation is complete.
 */
export function handleDeleteFileStorage(_msg: PluginMessage): void {
	const pluginDataKeys = figma.root.getPluginDataKeys()
	for (const key of pluginDataKeys) {
		figma.root.setPluginData(key, '')
		console.log(`[plugma] ${key} deleted from root pluginData`)
	}
	figma.notify('Root pluginData deleted')
}

handleDeleteFileStorage.EVENT_NAME = 'PLUGMA_DELETE_FILE_STORAGE' as const
