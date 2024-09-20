<script>
	import { nanoid } from 'nanoid'

	const html = document.querySelector('html')

	const isInsideIframe = window.self !== window.top
	const isInsideFigma = typeof figma !== 'undefined'

	let ws = new WebSocket('ws://localhost:9001/ws')

	function generateMessageId(data) {
		return nanoid()
	}

	// Listen for STUFF FROM FIGMA
	function catchFigmaStyles() {
		window.addEventListener('message', (event) => {
			// FIXME: Should message be sent so it's received as event.data.pluginMessage?
			const message = event.data

			if (message.type === 'FIGMA_HTML_CLASSES') {
				html.className = message.data
			}
			if (message.type === 'FIGMA_STYLES') {
				const styleSheet = document.createElement('style')
				styleSheet.type = 'text/css'
				styleSheet.innerText = message.data

				// Append the style tag to the head
				document.head.appendChild(styleSheet)
			}
		})
	}

	function overrideMessageEvent() {
		// Temporary custom listener to filter out messages
		const originalAddEventListener = window.addEventListener

		window.addEventListener = function (type, listener, options) {
			if (type === 'message') {
				const wrappedListener = function (event) {
					// If not inside iframe or Figma, log the message but don't call the listener
					if (!(isInsideIframe || isInsideFigma)) {
						console.log('--- Ignored message:', event.data)
						return
					}
					// Call the original listener when inside iframe or Figma
					listener(event)
				}
				// Attach the wrapped listener instead of the original
				originalAddEventListener.call(window, type, wrappedListener, options)
			} else {
				// For non-message events, use the original addEventListener method
				originalAddEventListener.call(window, type, listener, options)
			}
		}

		// Store the original onmessage handler
		let originalOnMessage = null

		// Define a custom setter for window.onmessage
		Object.defineProperty(window, 'onmessage', {
			set: function (handler) {
				originalOnMessage = function (event) {
					// If not inside iframe or Figma, log the message but don't call the handler
					if (!(isInsideIframe || isInsideFigma)) {
						console.log('--- Ignored message:', event.data)
						return
					}
					// Call the handler when inside iframe or Figma
					handler(event)
				}
				// Attach the wrapped handler
				window.addEventListener('message', originalOnMessage)
			},
			get: function () {
				return originalOnMessage
			},
		})
	}

	// function postToWebsocketServer() {
	// 	// Catch messages being posted and send to websocket
	// 	window.addEventListener('message', (event) => {
	// 		console.log('--- send to web socket', event.data)
	// 	})
	// }

	function interceptPostMessage() {
		// Store the original postMessage function
		const originalPostMessage = window.postMessage

		// Override postMessage if not inside iframe or Figma
		if (!(isInsideIframe || isInsideFigma)) {
			window.postMessage = function (message, targetOrigin, transfer) {
				// Intercept and log the message
				console.log('Intercepted postMessage:', message)
				if (ws.readyState === WebSocket.OPEN) {
					ws.send(JSON.stringify({ data: message }))
				} else {
					console.warn('WebSocket connection is not open')
				}
				return null
				// // Call the original postMessage to maintain functionality
				// originalPostMessage.call(window, message, targetOrigin, transfer)
			}
		}
	}

	catchFigmaStyles()
	overrideMessageEvent()
	interceptPostMessage()
</script>
