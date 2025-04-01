import { postMessageVia } from "../../shared/lib/postMessageVia";

export function observeChanges(client) {
	const styleSheetElement = document.getElementById("figma-style");

	if (styleSheetElement) {
		function postMessage(type, data) {
			let message = {
				pluginMessage: {
					type,
					data,
				},
				pluginId: "*",
			};
			postMessageVia(
				{
					iframeTarget: iframe,
					client,
					enableWebSocket: window.runtimeData.websockets,
				},
				["iframe", "ws"],
				message,
			);
		}

		function createObserver(target, messageType, getData) {
			// Post initial data
			postMessage(messageType, getData());

			const observer = new MutationObserver(() => {
				postMessage(messageType, getData());
			});

			observer.observe(target, {
				attributes: true,
				childList: true,
				subtree: true,
			});
		}

		createObserver(html, "FIGMA_HTML_CLASSES", () => html.className);
		createObserver(
			styleSheetElement,
			"FIGMA_STYLES",
			() => styleSheetElement.innerHTML,
		);
	}
}
