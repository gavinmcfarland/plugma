import Plugin from `./`


let __html__ = "";
let htmlString = "";

if (
	process.env.NODE_ENV === "development" ||
	process.env.NODE_ENV === "server"
) {
	htmlString = `<html id="app"></html>
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
	</script>`;
} else {
	htmlString = __html__;
}

__html__ = htmlString;

Plugin()

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
		if (msg.event === "plugma-delete-file-storage") {
			figma.notify("Root.pluginData deleted")
		}
		if (msg.event === "plugma-delete-client-storage") {
			figma.notify("ClientStorage deleted")
		}
	};
}



// interceptHtmlString()
// Plugin code
// listen for messages


