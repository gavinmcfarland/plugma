/**
 * Applies stored styles to the iframe.
 * Re-applies styles when the VITE server is restarted.
 */
export function applyStoredStyles() {
	const html = document.querySelector('html')
	const storedClasses = localStorage.getItem('figmaHtmlClasses')

	if (storedClasses && html) {
		html.className = storedClasses
	}

	const storedStyles = localStorage.getItem('figmaStyles')
	if (storedStyles) {
		const styleSheet = document.createElement('style')
		styleSheet.type = 'text/css'
		styleSheet.innerText = storedStyles
		document.head.appendChild(styleSheet)
	}
}
