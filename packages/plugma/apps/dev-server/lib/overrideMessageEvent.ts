import { addMessageListener } from '../../shared/lib/addMessageListener'

/**
 * When the UI is being previewed in the browser, the window.onmessage event needs to be overridden
 * to ensure message received from the websocket server are passed to the message event listeners in the users plugin ui code.
 */

export function overrideMessageEvent() {
	const isInsideIframe = window.self !== window.top

	if (!isInsideIframe) {
		let originalAddEventListener = window.addEventListener
		let originalOnMessageHandler: any = null
		let messageListeners: any[] = []

		// Override addEventListener for 'message' events
		window.addEventListener = function (
			type: string,
			listener: EventListenerOrEventListenerObject,
			options?: AddEventListenerOptions,
		) {
			if (type === 'message') {
				messageListeners.push(listener) // Store the listener
			} else {
				originalAddEventListener.call(window, type, listener, options)
			}
		}

		// Function to trigger all stored message listeners
		function triggerMessageListeners(event: MessageEvent) {
			messageListeners.forEach((listener) => {
				try {
					listener(event) // Call each listener
				} catch (err) {
					console.error('Error in message listener:', err)
				}
			})
		}

		// Intercept WebSocket messages and pass them to the stored message listeners
		addMessageListener('ws', (event) => {
			// Trigger all registered message listeners
			triggerMessageListeners(event)
		})

		// Override window.onmessage using Object.defineProperty
		Object.defineProperty(window, 'onmessage', {
			get: function () {
				return originalOnMessageHandler
			},
			set: function (handler) {
				originalOnMessageHandler = handler
				// Ensure WebSocket's onmessage works with the new handler
				addMessageListener('ws', (event) => {
					// Trigger the new handler
					if (originalOnMessageHandler) {
						originalOnMessageHandler(event)
					}

					// Also trigger all stored listeners
					triggerMessageListeners(event)
				})
			},
		})
	}
}
