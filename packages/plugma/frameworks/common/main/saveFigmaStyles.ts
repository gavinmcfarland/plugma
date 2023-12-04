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
