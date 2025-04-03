import { postMessageVia } from '../../shared/lib/postMessageVia'

export function getFigmaStyles() {
	console.log('fetchFigmaStyles')
	const isInsideIframe = window.self !== window.top

	let message = {
		pluginMessage: {
			type: 'GET_FIGMA_CLASSES_AND_STYLES',
		},
		pluginId: '*',
	}

	if (!isInsideIframe) {
		postMessageVia(['ws'], message)
	} else {
		postMessageVia(['iframe'], message)
	}
}
