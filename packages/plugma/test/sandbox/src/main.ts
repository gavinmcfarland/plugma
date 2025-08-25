// // How to move this into Plugma?
// import { handleTestMessage } from "plugma/testing/figma";

// figma.ui.on("message", async (message) => {
// 	handleTestMessage(message);
// });

// import { customTest } from './customTest'

// customTest()

export function main() {
	// console.clear()

	figma.showUI(__html__, { width: 300, height: 260, themeColors: true });

	figma.ui.postMessage({ type: 'PLUGIN_OPENED' });
}

async function postNodeCount() {
	const nodeCount = figma.currentPage.selection.length;

	figma.ui.postMessage({ type: 'POST_NODE_COUNT', count: nodeCount });
}

function on(event: string, handler: (...args: any[]) => void) {
	figma.ui.on(event, handler);
}

on('LICENSE_ACTIVATED_FROM_UI', async (licenseKey, isValid) => {});
export default main();
