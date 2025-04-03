import { postMessageVia } from '../../shared/lib/postMessageVia'

/**
 * Requests Figma styles from the plugin host. This function is necessary because
 * when a user opens multiple browser instances of the plugin UI, the websocket
 * server queues styles until a browser is available. The first browser instance
 * receives the queued styles, but subsequent browser instances need to explicitly
 * request styles since they missed the initial message.
 */
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
