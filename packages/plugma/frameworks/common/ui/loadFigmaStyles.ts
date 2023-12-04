function catchFigmaStyles() {
	parent.postMessage(
		{
			pluginMessage: {
				event: "get-figma-stylesheet",
			},
			pluginId: "*",
		},
		"*",
	);

	function onWindowMsg(msg: any) {
		// We listen for message to add figma styles during development
		const message = msg.data.pluginMessage;
		if (message && message.event === "pass-figma-stylesheet") {
			document.styleSheets[0].insertRule(message.styles);
			window.removeEventListener("message", onWindowMsg);
		}
	}

	window.addEventListener("message", onWindowMsg);
}

export { catchFigmaStyles };
