<script>
	const html = document.querySelector('html')

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

	catchFigmaStyles()

	const isInsideIframe = window.self !== window.top
	const isInsideFigma = typeof figma !== 'undefined'

	const originalAddEventListener = window.addEventListener

	window.addEventListener = function (type, listener, options) {
		if (type === 'message') {
			const wrappedListener = function (event) {
				// Ignore messages if not inside iframe or Figma
				if (!(isInsideIframe || isInsideFigma)) {
					return
				}
				listener(event) // Only call the original listener when conditions are met
			}
			originalAddEventListener.call(window, type, wrappedListener, options)
		} else {
			originalAddEventListener.call(window, type, listener, options)
		}
	}

	let originalOnMessage = null

	// Define a custom setter for window.onmessage
	Object.defineProperty(window, 'onmessage', {
		set: function (handler) {
			originalOnMessage = function (event) {
				// Ignore messages if not inside iframe or Figma
				if (!(isInsideIframe || isInsideFigma)) {
					return
				}
				handler(event) // Only call the handler when conditions are met
			}
			// Attach the wrapped handler
			window.addEventListener('message', originalOnMessage)
		},
		get: function () {
			return originalOnMessage
		},
	})
</script>

<div id="app">Vite app proxy</div>

<style>
	.container {
		/* keep background transparent to avoid flicker when changing theme in dev mode */
		color: var(--figma-color-text);
	}
</style>
