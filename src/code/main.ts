// // This plugin will open a modal to prompt the user to enter a number, and
// // it will then create that many rectangles on the screen.
// // This file holds the main code for the plugins. It has access to the *document*.
// // You can access browser APIs in the <script> tag inside "ui.html" which has a
// // full browser environment (see documentation).
// // This shows the HTML page in "ui.html".
// figma.showUI(__html__, { width: 350, height: 400, themeColors: true });
// // Calls to "parent.postMessage" from within the HTML page will trigger this
// // callback. The callback will be passed the "pluginMessage" property of the
// // posted message.
// figma.ui.onmessage = (msg) => {
//   // One way of distinguishing between different types of messages sent from
//   // your HTML page is to use an object with a "type" property like this.
//   // Make sure to close the plugin when you're done. Otherwise the plugin will
//   // keep running, which shows the cancel button at the bottom of the screen.
//   // figma.closePlugin();
// };

console.clear();

if (process.env.NODE_ENV === "development") {
	figma.showUI(
		`<html id="app"></html>
		<script>
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
	// figma.showUI(
	// 	`<script>window.location.replace(http://localhost:5173')</script>`,
	// 	{ width: 300, height: 500, themeColors: true },
	// );
}
if (process.env.NODE_ENV === "production") {
	figma.showUI(__html__, { width: 300, height: 500, themeColors: true });
}

figma.ui.onmessage = async (msg) => {
	if (msg.event === "save-figma-stylesheet") {
		figma.clientStorage.setAsync("figma-stylesheet", msg.styles);
	}
	if (msg.event === "get-figma-stylesheet") {
		let styles = await figma.clientStorage.getAsync("figma-stylesheet");
		figma.ui.postMessage({ event: "pass-figma-stylesheet", styles });
	}
};

const getSelectedNodes = () => {
	const selectedTextNodes = figma.currentPage.selection
		.filter((node) => node.type === "TEXT")
		.map((node: any) => ({ figmaNodeID: node.id, text: node.characters }));
	figma.ui.postMessage({
		event: "selected-text-nodes",
		nodes: selectedTextNodes,
	});
};

// figma.ui.onmessage = async (msg) => {
// 	if (msg.type === "create-text") {
// 		const newTextNode = figma.createText();
// 		await figma.loadFontAsync(<FontName>newTextNode.fontName);
// 		newTextNode.characters = msg.text;
// 		newTextNode.name = "Sample Text";

// 		figma.currentPage.appendChild(newTextNode);

// 		figma.currentPage.selection = [newTextNode];
// 	}
// 	if (msg.type === "update-text") {
// 		const textNode = <TextNode>figma.getNodeById(msg.figmaNodeID);
// 		await figma.loadFontAsync(<FontName>textNode.fontName);
// 		textNode.characters = msg.text;
// 		getSelectedNodes();
// 	}
// };

figma.on("selectionchange", () => getSelectedNodes());
