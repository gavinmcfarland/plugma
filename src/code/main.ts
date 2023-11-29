console.clear();

if (
	process.env.NODE_ENV === "development" ||
	process.env.NODE_ENV === "server"
) {
	figma.showUI(
		`<html id="app"></html>
		<script>
		// Grab figma styles before loading local dev url
		const styleSheet = document.styleSheets[0];
		const cssRules = styleSheet.cssRules || styleSheet.rules
		parent.postMessage({
			pluginMessage: {
				event: "save-figma-stylesheet",
				styles: document.styleSheets[0].cssRules[0].cssText
			}
		}, "https://www.figma.com")
		window.location.href = 'http://localhost:5173'
		</script>`,
		{ width: 300, height: 500, themeColors: true },
	);
}
if (process.env.NODE_ENV === "production") {
	figma.showUI(__html__, { width: 300, height: 500, themeColors: true });
}

// Save figma stylesheet so can send it to UI during development
if (
	process.env.NODE_ENV === "development" ||
	process.env.NODE_ENV === "server"
) {
	figma.ui.onmessage = async (msg) => {
		if (msg.event === "save-figma-stylesheet") {
			figma.clientStorage.setAsync("figma-stylesheet", msg.styles);
		}
		if (msg.event === "get-figma-stylesheet") {
			let styles = await figma.clientStorage.getAsync("figma-stylesheet");
			figma.ui.postMessage({ event: "pass-figma-stylesheet", styles });
		}
	};
}

// Your app code below

const getSelectedNodes = () => {
	const selectedTextNodes = figma.currentPage.selection
		.filter((node) => node.type === "TEXT")
		.map((node: any) => ({ figmaNodeID: node.id, text: node.characters }));
	figma.ui.postMessage({
		event: "selected-text-nodes",
		nodes: selectedTextNodes,
	});
};

figma.on("selectionchange", () => getSelectedNodes());
