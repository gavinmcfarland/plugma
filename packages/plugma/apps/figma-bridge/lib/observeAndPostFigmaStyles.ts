import { get } from 'svelte/store'
import { postMessageVia } from '../../shared/lib/postMessageVia'
import { htmlStore, wsClientStore } from '../../shared/stores'

/**
 * Sets up observers to monitor Figma's HTML and style changes in real-time. The function observes changes
 * to the HTML element's classes and Figma's style sheet, sending updates to both the iframe UI and browser UI.
 * Additionally, it posts the initial state when the function is first called.
 *
 * Important: The iframe must be loaded first before these messages are sent. I'm not sure why, as browser should queue them.
 */
export function observeAndPostFigmaStyles() {
	const styleSheetElement = document.getElementById('figma-style')
	const html = document.querySelector('html')

	if (styleSheetElement && html) {
		function postMessage(type: string, data: any) {
			let message = {
				pluginMessage: {
					type,
					data,
				},
				pluginId: '*',
			}
			postMessageVia(['iframe', 'ws'], message)
		}

		function createObserver(target: HTMLElement, messageType: string, getData: () => any) {
			// Post initial data
			postMessage(messageType, getData())

			const observer = new MutationObserver(() => {
				postMessage(messageType, getData())
			})

			observer.observe(target, {
				attributes: true,
				childList: true,
				subtree: true,
			})
		}

		createObserver(html, 'FIGMA_HTML_CLASSES', () => html.className)
		createObserver(styleSheetElement, 'FIGMA_STYLES', () => styleSheetElement.innerHTML)
	}
}
