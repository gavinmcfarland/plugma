import { addMessageListener } from "../../shared/lib/addMessageListener";

export function listenForFigmaStyles(client) {
	const handleMessage = (event) => {
		const message = event.data.pluginMessage;

		if (message.type === "FIGMA_HTML_CLASSES") {
			html.className = message.data;

			// Save styles because they are lost when VITE server resets
			localStorage.setItem("figmaHtmlClasses", message.data);
		}
		if (message.type === "FIGMA_STYLES") {
			const styleSheet = document.createElement("style");
			styleSheet.type = "text/css";
			styleSheet.innerText = message.data;

			// Append the style tag to the head
			document.head.appendChild(styleSheet);

			// Save styles because they are lost when VITE server resets
			localStorage.setItem("figmaStyles", message.data);

			// Optionally remove the listener once the style is applied
			// window.removeEventListener('message', handleMessage)
		}
	};

	addMessageListener(
		{ client, enableWebSocket: window.runtimeData.websockets },
		["window"],
		handleMessage,
	);
}
