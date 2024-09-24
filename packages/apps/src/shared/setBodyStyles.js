// Remove padding and margin because app has it's own body tag
export function setBodyStyles() {
	document.body.style.padding = '0'
	document.body.style.margin = '0'
	document.body.style.color = 'var(--figma-color-text)'
	document.body.style.fontFamily = 'Inter, system-ui, Helvetica, Arial, sans-serif'
}
