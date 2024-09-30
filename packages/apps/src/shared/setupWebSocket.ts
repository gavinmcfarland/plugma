import ReconnectingWebSocket from 'reconnecting-websocket'
import { Log } from '../../../plugma/lib/logger'

const log = new Log({
	debug: window.runtimeData.debug,
})

interface ExtendedWebSocket extends ReconnectingWebSocket {
	post: (messages: any, via: any) => void
	on: (callback: any, via: any) => void
	open: (callback: () => void) => void
}

export function setupWebSocket(iframeTarget = null, enableWebSocket = true): ExtendedWebSocket | typeof mockWebSocket {
	const messageQueue: any[] = [] // Queue to hold messages until WebSocket is open
	let openCallbacks: (() => void)[] = [] // Store callbacks to execute on WebSocket open

	const mockWebSocket = {
		send: (data) => {
			console.warn('WebSocket is disabled, cannot send data:', data)
		},
		post: (messages, via) => {
			if (Array.isArray(messages)) {
				messages.forEach((message) => sendMessageToTargets(message, via))
			} else {
				sendMessageToTargets(messages, via)
			}
		},
		on: (callback, via) => {
			if (Array.isArray(via)) {
				via.forEach((method) => addMessageListener(method, callback))
			} else {
				addMessageListener(via, callback)
			}
		},
		open: (callback) => {
			console.warn('WebSocket is disabled, cannot trigger open.')
		},
		close: () => {
			console.warn('WebSocket is disabled, no connection to close.')
		},
		addEventListener: (type, listener) => {
			console.warn(`WebSocket is disabled, cannot add event listener for ${type}.`)
		},
		removeEventListener: (type, listener) => {
			console.warn(`WebSocket is disabled, cannot remove event listener for ${type}.`)
		},
		onmessage: null,
		onopen: null,
		onclose: null,
		onerror: null,
	}

	function sendMessageToTargets(message, via) {
		if (Array.isArray(via)) {
			via.forEach((option) => postMessageVia(option, message))
		} else {
			postMessageVia(via, message)
		}
	}

	function postMessageVia(via, message) {
		log.info(`--- ws post, ${via}`, message)
		if (via === 'iframe' && iframeTarget && iframeTarget.contentWindow.postMessage) {
			iframeTarget.contentWindow.postMessage(message, '*')
		} else if (via === 'parent' && window.parent) {
			window.parent.postMessage(message, '*')
		} else if (via === 'ws') {
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify(message))
			} else {
				console.warn('WebSocket is not open, queuing message:', message)
				messageQueue.push({ message, via }) // Queue the message if WebSocket is not open
			}
		} else {
			console.warn(`Cannot send message via ${via}.`)
		}
	}

	function addMessageListener(via, callback) {
		if (via === 'window') {
			window.addEventListener('message', callback)
		} else if (via === 'parent' && window.parent) {
			window.addEventListener('message', (event) => {
				if (event.source === window.parent) {
					callback(event)
				}
			})
		} else if (via === 'ws') {
			ws.addEventListener('message', (event) => {
				try {
					const parsedData = JSON.parse(JSON.parse(event.data))
					const newEvent = { ...event, data: parsedData }
					callback(newEvent)
				} catch (error) {
					console.error('Failed to parse WebSocket message data:', error)
					callback(event)
				}
			})
		} else {
			console.warn(`Cannot add message listener via ${via}.`)
		}
	}

	if (!enableWebSocket || !('WebSocket' in window)) {
		console.warn('WebSocket is disabled or not supported, using mock WebSocket.')
		return mockWebSocket
	}

	let ws = new ReconnectingWebSocket('ws://localhost:9001/ws') as ExtendedWebSocket

	ws.post = (messages, via = ['ws']) => {
		if (Array.isArray(messages)) {
			messages.forEach((message) => sendMessageToTargets(message, via))
		} else {
			sendMessageToTargets(messages, via)
		}
	}

	ws.on = (callback, via = ['ws']) => {
		if (Array.isArray(via)) {
			via.forEach((method) => addMessageListener(method, callback))
		} else {
			addMessageListener(via, callback)
		}
	}

	// Expose an open function for external triggering
	ws.open = (callback: () => void) => {
		openCallbacks.push(callback) // Always store callback
		if (ws.readyState === WebSocket.OPEN) {
			callback() // Trigger callback immediately if WebSocket is already open
		}
	}

	const handleOnOpen = () => {
		// Execute all queued callbacks
		openCallbacks.forEach((cb) => cb())

		// Send any queued messages
		while (messageQueue.length > 0) {
			const { message, via } = messageQueue.shift() // Dequeue a message
			sendMessageToTargets(message, via)
		}
	}

	ws.onopen = handleOnOpen

	ws.onmessage = (message) => {
		log.info('--- ws received', message.data)
	}

	ws.onclose = () => {
		// setupWebSocket(enableWebSocket, iframeTarget)
		// setTimeout(() => {
		// 	setupWebSocket(enableWebSocket, iframeTarget)
		// }, 100)
	}

	// ws.onerror = (error) => {
	// 	console.error('WebSocket error:', error)
	// }

	return ws
}
