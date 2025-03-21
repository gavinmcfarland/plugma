// import type { TestMessage } from "plugma/testing";
// import { handleTestMessage } from "plugma/testing";

console.log("[MAIN] Registering tests");
import "../tests/index-test-registry";

import { handleTestMessage } from "plugma/testing/figma";

export default function () {
	figma.showUI(__html__, { width: 300, height: 260, themeColors: true });

	figma.ui.onmessage = async (message) => {
		if (message?.event !== "ping" && message?.event !== "pong") {
			console.log("[FIGMA MAIN] Received message:", message);
		}

		if (message.type === "CREATE_RECTANGLES") {
			let i = 0;

			const rectangles = [];
			while (i < message.count) {
				const rect = figma.createRectangle();
				rect.x = i * 150;
				rect.y = 0;
				rect.resize(100, 100);
				rect.fills = [
					{
						type: "SOLID",
						color: { r: Math.random(), g: Math.random(), b: Math.random() },
					},
				]; // Random color
				rectangles.push(rect);

				i++;
			}

			figma.viewport.scrollAndZoomIntoView(rectangles);
		}

		handleTestMessage(message);
	};

	function postNodeCount() {
		const nodeCount = figma.currentPage.selection.length;

		figma.ui.postMessage({
			type: "POST_NODE_COUNT",
			count: nodeCount,
		});
	}

	figma.on("selectionchange", postNodeCount);
}
