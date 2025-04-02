import { encodeMessage } from './encodeMessage'
import { get } from 'svelte/store'
import { wsClientStore, wsEnabled } from '../../shared/stores'

export function postMessageVia(via: string | string[], message: any) {
	const iframeTarget = document.getElementById('dev-server-ui') as HTMLIFrameElement
	const client = get(wsClientStore)
	const isInsideIframe = window.self !== window.top

	// console.log('--- post message', via, message)
	const enableWebSocket = get(wsEnabled)
	// Convert single string to array for consistent handling
	const viaMethods = Array.isArray(via) ? via : [via]

	for (const method of viaMethods) {
		if (method === 'iframe' && iframeTarget && iframeTarget.contentWindow?.postMessage) {
			console.log(
				'%c[main      ] %c→→→ %c[ui:iframe ]',
				'color: initial;',
				'color: blue;',
				'color: initial;',
				message,
			)

			iframeTarget.contentWindow!.postMessage(message, '*')
		} else if (method === 'parent' && window.parent) {
			// Only send message to figma if message not from figma
			// FIXME: Should websocket server even be sending this message to figma?
			if (message.from !== 'figma') {
				console.log(
					'%c[main      ] %c←←← %c[ui:iframe ]',
					'color: initial;',
					'color: red;',
					'color: initial;',
					message,
				)

				window.parent.postMessage(message, '*')
			}
		} else if (method === 'ws') {
			// if (enableWebSocket === true || enableWebSocket === null) {
			if (client) {
				try {
					if (isInsideIframe) {
						console.log(
							'%c[main      ] %c→→→ %c[ui:browser]',
							'color: initial;',
							'color: green;',
							'color: initial;',
							message,
						)
					} else {
						console.log(
							'%c[main      ] %c←←← %c[ui:browser]',
							'color: initial;',
							'color: red;',
							'color: initial;',
							message,
						)
					}

					client.emit('message', message)
				} catch (error) {
					console.log('1', error)
				}
			}
			// }
		} else {
			console.warn(`Cannot send message via ${method}.`)
		}
	}
}
