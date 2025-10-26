/**
 * Sets default styles for the document body element.
 * Configures padding, margin, text color, font family, font size, and display properties
 * to match Figma's default setting for plugin UI window.
 */
export function setBodyStyles() {
	document.body.style.padding = "0";
	document.body.style.margin = "0";
	document.body.style.color = "var(--figma-color-text)";
	document.body.style.fontFamily =
		"Inter, system-ui, Helvetica, Arial, sans-serif";
	document.body.style.fontSize = "16px";
	document.body.style.display = "flex";
}
