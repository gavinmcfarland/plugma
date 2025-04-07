export function getRoom() {
	let isInsideIframe = window.self !== window.top;
	let isInsideFigma = typeof figma !== "undefined";

	return isInsideIframe || isInsideFigma ? "figma" : "browser";
}
