import { addMessageListener } from '../../shared/lib/addMessageListener'

/**
 * Receives Figma styles and classes sent by figma-bridge and applies them to the iframe.
 * This is necessary because Figma's styles aren't automatically inherited from the parent window.
 * It also saves the styles to localStorage so that they persist when the VITE server is restarted.
 */

export function listenForFigmaStyles() {
	const isInIframe = window.self !== window.top
	const html = document.querySelector('html')
	const handleMessage = (event: any) => {
		const message = event.data.pluginMessage

		if (message.type === 'FIGMA_HTML_CLASSES' && html) {
			html.className = message.data

			// Save styles because they are lost when VITE server resets
			localStorage.setItem('figmaHtmlClasses', message.data)
		}
		if (message.type === 'FIGMA_STYLES') {
			const styleSheet = document.createElement('style')
			styleSheet.type = 'text/css'
			styleSheet.innerText = message.data

			// Append the style tag to the head
			document.head.appendChild(styleSheet)

			// Save styles because they are lost when VITE server resets
			localStorage.setItem('figmaStyles', message.data)

			// Optionally remove the listener once the style is applied
			// window.removeEventListener('message', handleMessage)
		}
	}

	if (isInIframe) {
		addMessageListener('window', handleMessage)
	} else {
		addMessageListener('ws', handleMessage)
	}
}
