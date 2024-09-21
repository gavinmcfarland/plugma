<script>
	import { nanoid } from 'nanoid'

	const html = document.querySelector('html')

	const isInsideIframe = window.self !== window.top
	const isInsideFigma = typeof figma !== 'undefined'

	let ws = new WebSocket('ws://localhost:9001/ws')
	const processedMessages = new Set()

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
		if (!(isInsideIframe || isInsideFigma)) {
			// Temporary custom listener to filter out messages
			// Store original event listeners for messages
			let originalAddEventListener = window.addEventListener
			let originalOnMessageHandler = null

			// Override addEventListener for 'message' events
			window.addEventListener = function (type, listener, options) {
				if (type === 'message') {
					// console.log("Intercepting addEventListener for 'message'")
					// Hook into WebSocket messages
					ws.onmessage = (event) => {
						const message = JSON.parse(event.data)

						const webSocketMessage = JSON.parse(message.webSocketMessage)
						// console.log('Message received from WebSocket:', webSocketMessage.data)
						// Trigger the original message listener if needed
						listener({ data: webSocketMessage.data })
					}
				} else {
					// Use original addEventListener for other events
					originalAddEventListener.call(window, type, listener, options)
				}
			}

			// Function to assign WebSocket onmessage to window.onmessage
			function reassignWebSocketHandler() {
				// Ensure that WebSocket messages are forwarded to the assigned window.onmessage handler
				ws.onmessage = (wsEvent) => {
					if (originalOnMessageHandler) {
						const message = JSON.parse(wsEvent.data)

						const webSocketMessage = JSON.parse(message.webSocketMessage)
						// console.log('Message received from WebSocket:', webSocketMessage.data)
						originalOnMessageHandler({ data: webSocketMessage.data })
					}
				}
			}

			// Override window.onmessage using Object.defineProperty
			Object.defineProperty(window, 'onmessage', {
				get: function () {
					return originalOnMessageHandler
				},
				set: function (handler) {
					// console.log('Intercepting onmessage assignment')
					// Store the new handler
					originalOnMessageHandler = handler
					// Reassign WebSocket's onmessage to trigger the new handler
					reassignWebSocketHandler()
				},
			})
		}
	}

	function interceptPostMessage() {
		// Store if messages have already been sent

		// Store the original postMessage function
		const originalPostMessage = window.postMessage

		// Override postMessage if not inside iframe or Figma
		if (!(isInsideIframe || isInsideFigma)) {
			window.postMessage = function (message, targetOrigin, transfer) {
				// Intercept and log the message
				console.log('browser --> wss', message)
				let messageId = nanoid()
				// Check if this message has already been processed
				if (!processedMessages.has(messageId)) {
					processedMessages.add(messageId)
					if (ws.readyState === WebSocket.OPEN) {
						ws.send(JSON.stringify({ messageId, clientType: 'browser', data: message }))
					} else {
						console.warn('WebSocket connection is not open')
					}
				}

				return null
				// // Call the original postMessage to maintain functionality
				// originalPostMessage.call(window, message, targetOrigin, transfer)
			}
		}
	}

	function listenForWebSocketMessage() {
		if (!(isInsideIframe || isInsideFigma)) {
			ws.onmessage = (event) => {
				const message = JSON.parse(event.data)

				const webSocketMessage = JSON.parse(message.webSocketMessage)

				console.log(`main <-- wss <-- ${webSocketMessage.clientType}`, webSocketMessage.data)
				// parent.postMessage(webSocketMessage.data, '*')
			}
		}
	}

	function reimplementFigmaListeners() {
		document.addEventListener(
			'keydown',
			(e) => {
				if (e.keyCode === 80 /* P */ && !e.shiftKey && e.altKey && !e.ctrlKey && e.metaKey) {
					// Handle the plugin re-run shortcut
					window.parent.postMessage('$INTERNAL_DO_NOT_USE$RERUN_PLUGIN$', '*')
					e.stopPropagation()
					e.stopImmediatePropagation()
				} else if (true) {
					// Handle Select All, Undo and Redo in the desktop app
					const ctrlDown = e.metaKey
					if (ctrlDown) {
						if (e.keyCode === 65 /* A */) {
							document.execCommand('selectAll')
						} else if (e.keyCode === 90 /* Z */) {
							if (e.shiftKey) {
								document.execCommand('redo')
							} else {
								document.execCommand('undo')
							}
						} else if ((e.key === 'x' || e.key === 'X') && false) {
							document.execCommand('cut')
						} else if ((e.key === 'c' || e.key === 'C') && false) {
							document.execCommand('copy')
						} else if ((e.key === 'v' || e.key === 'V') && false) {
							document.execCommand('paste')
						}
					}
				}
			},
			true,
		)
	}

	catchFigmaStyles()

	// listenForWebSocketMessage()
	reimplementFigmaListeners()
	interceptPostMessage()
	overrideMessageEvent()
</script>
