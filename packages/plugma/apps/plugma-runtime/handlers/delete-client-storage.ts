import type { PluginMessage } from '../../shared/types.js'

/**
 * Deletes all client storage data except for the Figma stylesheet.
 * Notifies the user when the operation is complete.
 */
export async function handleDeleteClientStorage(_msg: PluginMessage): Promise<void> {
	const clientStorageKeys = await figma.clientStorage.keysAsync()
	for (const key of clientStorageKeys) {
		if (key !== 'figma-stylesheet') {
			await figma.clientStorage.deleteAsync(key)
			console.log(`[plugma] ${key} deleted from clientStorage`)
		}
	}
	figma.notify('ClientStorage deleted')
}

handleDeleteClientStorage.EVENT_NAME = 'PLUGMA_DELETE_CLIENT_STORAGE' as const
