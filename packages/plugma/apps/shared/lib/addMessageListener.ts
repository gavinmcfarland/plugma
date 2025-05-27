import { decodeMessage } from './decodeMessage'
import { wsClientStore } from '../stores'
import { get } from 'svelte/store'

// FIXME: Use of addMessageListener needs refactoring so that duplicate listeners are not added.
export function addMessageListener(via: string, callback: (event: MessageEvent) => void) {
	const socket = get(wsClientStore)
	const isInsideIframe = window.self !== window.top

	if (via === 'window') {
		window.addEventListener('message', callback)
	} else if (via === 'parent' && window.parent) {
		window.addEventListener('message', (event) => {
			if (event.source === window.parent) {
				callback(event)
			}
		})
	} else if (via === 'ws') {
		// Should this be onAny? or on('message')?
		if (window.runtimeData.websockets) {
			socket.on('message', (data: any) => {
				try {
					// const newEvent = { ...event, data: data.message }
					const newEvent = { data }

					// // Only show if not in iframe (ie in browser)
					// if (!isInsideIframe) {
					// 	console.log(
					// 		'%c[ui:browser] %c→→→ %c[ui:figma  ]',
					// 		'color: initial;',
					// 		'color: green;',
					// 		'color: initial;',
					// 		data,
					// 	)
					// }

					callback(newEvent)
				} catch (error) {
					console.error('Failed to parse WebSocket message data:', error)
					callback(data)
				}
			})
		}
	} else {
		// console.warn(`Cannot add message listener via ${via}.`)
	}
}
