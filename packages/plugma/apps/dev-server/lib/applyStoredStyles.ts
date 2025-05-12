/**
 * Applies stored styles to the iframe.
 * Re-applies styles when the VITE server is restarted.
 */
export function applyStoredStyles() {
	const html = document.querySelector('html')

	// Check if localStorage is available
	const isLocalStorageAvailable = (() => {
		try {
			const test = '__storage_test__'
			localStorage.setItem(test, test)
			localStorage.removeItem(test)
			return true
		} catch (e) {
			return false
		}
	})()

	if (!isLocalStorageAvailable) {
		return
	}

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
