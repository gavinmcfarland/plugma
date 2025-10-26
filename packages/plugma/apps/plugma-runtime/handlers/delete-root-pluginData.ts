/**
 * Handles deletion of all plugin data from the root node
 */
export async function handleDeleteRootPluginData() {
	const pluginDataKeys = figma.root.getPluginDataKeys();
	for (const key of pluginDataKeys) {
		figma.root.setPluginData(key, "");
		console.log(`[plugma] ${key} deleted from root pluginData`);
	}
	figma.notify("Root pluginData deleted");
}
handleDeleteRootPluginData.EVENT_NAME = "PLUGMA_DELETE_ROOT_PLUGIN_DATA";
