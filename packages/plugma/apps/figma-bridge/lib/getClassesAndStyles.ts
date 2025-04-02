import { addMessageListener } from '../../shared/lib/addMessageListener'
import { postMessageVia } from '../../shared/lib/postMessageVia'

export function getClassesAndStyles() {
	const html = document.querySelector('html')
	const styleSheetElement = document.getElementById('figma-style')

	if (styleSheetElement) {
		addMessageListener('ws', (event) => {
			const message = event.data.pluginMessage

			if (message.type === 'GET_FIGMA_CLASSES_AND_STYLES' && html) {
				const messages = [
					{
						pluginMessage: {
							type: 'FIGMA_HTML_CLASSES',
							data: html.className,
						},
					},
					{
						pluginMessage: {
							type: 'FIGMA_STYLES',
							data: styleSheetElement.innerHTML,
						},
					},
				]
				postMessageVia(['ifream', 'ws'], messages)
			}
		})
	}
}
