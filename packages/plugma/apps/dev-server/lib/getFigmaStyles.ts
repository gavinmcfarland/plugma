export function getFigmaStyles() {
	let message = {
		pluginMessage: {
			type: "GET_FIGMA_CLASSES_AND_STYLES",
		},
		pluginId: "*",
	};
	parent.postMessage(message, "*");
}
