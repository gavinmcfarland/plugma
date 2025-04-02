import { decodeMessage } from './decodeMessage'
import { wsEnabled, wsClientStore } from '../stores'
import { get } from 'svelte/store'

export function addMessageListener(via: string, callback: (event: MessageEvent) => void) {
	const enableWebSocket = get(wsEnabled)
	const socket = get(wsClientStore)
	const isInsideIframe = window.self !== window.top

	console.log('--- addMessageListener', via)

	if (via === 'window') {
		window.addEventListener('message', callback)
	} else if (via === 'parent' && window.parent) {
		window.addEventListener('message', (event) => {
			if (event.source === window.parent) {
				callback(event)
			}
		})
	} else if (via === 'ws') {
		// if (enableWebSocket) {
		socket.onAny((event: any, data: any) => {
			try {
				const newEvent = { ...event, data: data.message }

				// // Only show if not in iframe (ie in browser)
				if (!isInsideIframe) {
					console.log(
						'%c[ui:browser] %c→→→ %c[ui:figma  ]',
						'color: initial;',
						'color: green;',
						'color: initial;',
						data.message,
					)
				}

				callback(newEvent)
			} catch (error) {
				console.error('Failed to parse WebSocket message data:', error)
				callback(event)
			}
		})
		// }
	} else {
		// console.warn(`Cannot add message listener via ${via}.`)
	}
}
