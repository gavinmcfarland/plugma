<script>
	import { nanoid } from 'nanoid'
	import { onMount } from 'svelte'

	import { monitorUrl } from '../../shared/monitorUrl'
	import ServerStatus from '../PluginWindow/lib/ServerStatus.svelte'
	import app from './main'

	const html = document.querySelector('html')

	const isInsideIframe = window.self !== window.top
	const isInsideFigma = typeof figma !== 'undefined'

	let ws = new WebSocket('ws://localhost:9001/ws')
	let url = `http://localhost:${window.runtimeData.port}`

	const processedMessages = new Set()

	function sendWsMessage(ws, message) {
		const waitForOpenConnection = () => {
			return new Promise((resolve, reject) => {
				const maxRetries = 10 // Maximum number of retries
				let retries = 0

				const interval = setInterval(() => {
					if (ws.readyState === WebSocket.OPEN) {
						clearInterval(interval)
						resolve()
					} else if (retries >= maxRetries) {
						clearInterval(interval)
						reject(new Error('WebSocket connection failed to open.'))
					}
					retries++
				}, 100) // Check every 100ms
			})
		}

		const send = async () => {
			try {
				if (ws.readyState !== WebSocket.OPEN) {
					await waitForOpenConnection()
				}
				console.log('---- sending message.....', message)
				ws.send(JSON.stringify(message))
				// console.log('Message sent:', message)
			} catch (error) {
				console.error('Failed to send message:', error)
			}
		}

		send()
	}

	function listenForFigmaStyles() {
		const handleMessage = (event) => {
			const message = event.data.pluginMessage

			if (message.type === 'FIGMA_HTML_CLASSES') {
				html.className = message.data
			}
			if (message.type === 'FIGMA_STYLES') {
				const styleSheet = document.createElement('style')
				styleSheet.type = 'text/css'
				styleSheet.innerText = message.data

				// Append the style tag to the head
				document.head.appendChild(styleSheet)

				// Optionally remove the listener once the style is applied
				// window.removeEventListener('message', handleMessage)
			}
		}

		window.addEventListener('message', handleMessage)
	}

	function getFigmaStyles() {
		let message = {
			pluginMessage: {
				type: 'GET_FIGMA_CLASSES_AND_STYLES',
			},
			pluginId: '*',
		}
		parent.postMessage(message, '*')
	}

	function overrideMessageEvent() {
		if (!(isInsideIframe || isInsideFigma)) {
			let originalAddEventListener = window.addEventListener
			let originalOnMessageHandler = null
			let messageListeners = []

			// Override addEventListener for 'message' events
			window.addEventListener = function (type, listener, options) {
				if (type === 'message') {
					messageListeners.push(listener) // Store the listener
				} else {
					originalAddEventListener.call(window, type, listener, options)
				}
			}

			// Function to trigger all stored message listeners
			function triggerMessageListeners(event) {
				messageListeners.forEach((listener) => {
					try {
						listener(event) // Call each listener
					} catch (err) {
						console.error('Error in message listener:', err)
					}
				})
			}

			// Intercept WebSocket messages and pass them to the stored message listeners
			ws.onmessage = (wsEvent) => {
				const message = JSON.parse(wsEvent.data)
				const event = { data: JSON.parse(message) }

				// Trigger all registered message listeners
				triggerMessageListeners(event)
			}

			// Override window.onmessage using Object.defineProperty
			Object.defineProperty(window, 'onmessage', {
				get: function () {
					return originalOnMessageHandler
				},
				set: function (handler) {
					originalOnMessageHandler = handler
					// Ensure WebSocket's onmessage works with the new handler
					ws.onmessage = (wsEvent) => {
						const message = JSON.parse(wsEvent.data)
						const event = { data: JSON.parse(message) }

						// Trigger the new handler
						if (originalOnMessageHandler) {
							originalOnMessageHandler(event)
						}

						// Also trigger all stored listeners
						triggerMessageListeners(event)
					}
				},
			})
		}
	}

	function interceptPostMessage() {
		// Override postMessage if not inside iframe or Figma
		if (!(isInsideIframe || isInsideFigma)) {
			// Store the original postMessage function
			const originalPostMessage = window.postMessage

			window.postMessage = function (message, targetOrigin, transfer) {
				// Intercept and log the message
				let messageId = nanoid()
				// Check if this message has already been processed
				// if (!processedMessages.has(messageId)) {
				// processedMessages.add(messageId)
				console.log('POST MESSAGE', message)
				sendWsMessage(ws, message)
				// }

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

	// listenForWebSocketMessage()
	reimplementFigmaListeners()
	interceptPostMessage()
	overrideMessageEvent()
	listenForFigmaStyles()

	ws.onopen = () => {
		getFigmaStyles()
	}

	let isServerActive = true

	$: monitorUrl(url, null, (isActive) => {
		isServerActive = isActive
	})

	onMount(async () => {
		parent.postMessage(
			{
				pluginMessage: { type: 'VITE_APP_MOUNTED' },
				pluginId: '*',
			},
			'*',
		)
	})
</script>

<!-- so it only appears in browser, because don't want overlap with one in PluginWindow-->
{#if !isServerActive && !(isInsideIframe || isInsideFigma)}
	<ServerStatus></ServerStatus>
{/if}
