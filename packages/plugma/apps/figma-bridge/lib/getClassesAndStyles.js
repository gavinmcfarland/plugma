import { addMessageListener } from "../../shared/lib/addMessageListener";
import { postMessageVia } from "../../shared/lib/postMessageVia";

export function getClassesAndStyles(client) {
	const styleSheetElement = document.getElementById("figma-style");

	if (styleSheetElement) {
		addMessageListener(
			{ client, enableWebSocket: window.runtimeData.websockets },
			["ws"],
			(event) => {
				const message = event.data.pluginMessage;

				if (message.type === "GET_FIGMA_CLASSES_AND_STYLES") {
					const messages = [
						{
							pluginMessage: {
								type: "FIGMA_HTML_CLASSES",
								data: html.className,
							},
						},
						{
							pluginMessage: {
								type: "FIGMA_STYLES",
								data: styleSheetElement.innerHTML,
							},
						},
					];
					postMessageVia(
						{
							iframeTarget: iframe,
							client,
							enableWebSocket: window.runtimeData.websockets,
						},
						messages,
						["iframe", "ws"],
					);
				}
			},
		);
	}
}