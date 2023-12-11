import { saveFigmaStyles } from "plugma/frameworks/common/main/saveFigmaStyles";

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

saveFigmaStyles();

export { __html__ };
