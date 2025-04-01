export function applyStoredStyles(html) {
	const storedClasses = localStorage.getItem("figmaHtmlClasses");

	if (storedClasses) {
		html.className = storedClasses;
	}

	const storedStyles = localStorage.getItem("figmaStyles");
	if (storedStyles) {
		const styleSheet = document.createElement("style");
		styleSheet.type = "text/css";
		styleSheet.innerText = storedStyles;
		document.head.appendChild(styleSheet);
	}
}
