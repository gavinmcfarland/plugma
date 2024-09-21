<script>
	import { onMount } from 'svelte'
	let pluginWindowIframe
	const figmaOrigin = 'https://www.figma.com'
	const html = document.querySelector('html')

	function postMessage(type, data, target, ws) {
		target.postMessage(
			{
				type,
				data,
			},
			'*',
		)

		// ws.send(
		// 	JSON.stringify({
		// 		data: {
		// 			type,
		// 			data,
		// 		},
		// 	}),
		// )
	}

	// Redirect iframe to a new URL
	function redirectIframe() {
		pluginWindowIframe.src = new URL('http://localhost:5173').href
	}

	// Pass messages between parent and plugin window wrapper iframe
	function relayFigmaMessages() {
		window.onmessage = (event) => {
			if (event.origin === 'https://www.figma.com') {
				console.log('post downwards')
				pluginWindowIframe.contentWindow.postMessage(event.data, '*')
			} else {
				console.log('post upwards')
				parent.postMessage(event.data, '*')
			}
		}
	}

	function relayWebSocketMessages() {
		let ws = new WebSocket('ws://localhost:9001/ws')

		function isWebSocketOpen() {
			return ws.readyState === WebSocket.OPEN
		}

		ws.onopen = function () {
			console.log('------- websocket open')
			// wss -> figma main
			ws.onmessage = (event) => {
				const message = JSON.parse(event.data)

				const webSocketMessage = JSON.parse(message.webSocketMessage)
				console.log(`main <-- wss <-- ${webSocketMessage.clientType}`, webSocketMessage.data)
				parent.postMessage(webSocketMessage.data, '*')
			}

			// figma main -> wss
			window.addEventListener('message', (event) => {
				if (event.origin === 'https://www.figma.com') {
					console.log('main --> wss --> browser', event.data)
					ws.send(JSON.stringify({ clientType: 'pluginWindow', data: event.data }))
				}
			})
		}
	}

	function observeChanges() {
		let ws = new WebSocket('ws://localhost:9001/ws')

		function postFigmaClasses() {
			const observer = new MutationObserver((mutationsList) => {
				for (let mutation of mutationsList) {
					if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
						// Post the message to the iframe
						postMessage('FIGMA_HTML_CLASSES', html.className, pluginWindowIframe.contentWindow, ws)
					}
				}
			})

			// Start observing the element
			observer.observe(html, {
				attributes: true, // Watch for attribute changes
				attributeFilter: ['class'], // Specifically watch the 'class' attribute
			})
		}

		function postFigmaStyles() {
			// Assuming the stylesheet is the first one in the document
			const styleSheetElement = document.getElementById('figma-style') // Find the corresponding <style> or <link> element

			// Create a MutationObserver to watch for changes in the style element
			const observer = new MutationObserver(() => {
				postMessage('FIGMA_STYLES', styleSheetElement.innerHTML, pluginWindowIframe.contentWindow, ws)
			})

			// Start observing the <style> or <link> element for changes
			observer.observe(styleSheetElement, {
				attributes: true,
				childList: true,
				subtree: true,
			})

			// Optionally, call postUpdatedStyles immediately to send the initial styles
			postMessage('FIGMA_STYLES', styleSheetElement.innerHTML, pluginWindowIframe.contentWindow, ws)
		}

		// Wait for the iframe to be mounted
		pluginWindowIframe.onload = () => {
			postFigmaClasses()
			postFigmaStyles()
		}
	}

	// Remove padding and margin because app has it's own body tag
	function setBodyStyles() {
		document.body.style.padding = 0
		document.body.style.margin = 0
	}

	function resizePluginWindow() {
		// Experiment to listen for changes to window size
		const resizeObserver = new ResizeObserver((entries) => {
			for (let entry of entries) {
				// Access the size of the entry (the window in this case)
				const { width, height } = entry.contentRect
				console.log(`Window size changed. Width: ${width}, Height: ${height}`)
			}
		})

		// Observe changes on the body or any element related to the window size
		resizeObserver.observe(document.body)
	}

	onMount(() => {
		redirectIframe()
		relayFigmaMessages()
		observeChanges()
		relayWebSocketMessages()
		setBodyStyles()
		// resizePluginWindow()
	})
</script>

<iframe title="" id="vite-app-host" bind:this={pluginWindowIframe}></iframe>

<style>
	#vite-app-host {
		width: 100%;
		height: 100vh;
		border: none;
	}
</style>
