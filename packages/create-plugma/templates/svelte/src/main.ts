import { __html__ } from "plugma/frameworks/common/main/interceptHtmlString";

// Your app code below

figma.showUI(__html__, { width: 300, height: 500, themeColors: true });

// const getSelectedNodes = () => {
// 	const selectedTextNodes = figma.currentPage.selection
// 		.filter((node) => node.type === "TEXT")
// 		.map((node: any) => ({ figmaNodeID: node.id, text: node.characters }));
// 	figma.ui.postMessage({
// 		event: "selected-text-nodes",
// 		nodes: selectedTextNodes,
// 	});
// 	console.log("postmessage", selectedTextNodes);
// };

// figma.on("selectionchange", () => getSelectedNodes());
