import { saveFigmaStyles } from "./saveFigmaStyles";

if (process.env.NODE_ENV === "development") {
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

let html = __html__;
let htmlString = __html__;

if (process.env.NODE_ENV === "development") {
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
	html = htmlString;
} else {
	htmlString = __html__;
	html = htmlString;
}

saveFigmaStyles();

export { html as __html__ };
