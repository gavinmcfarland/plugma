<script>
	import { nanoid } from 'nanoid'
	import ServerStatus from './lib/ServerStatus.svelte'

	import { onMount } from 'svelte'

	let myVar
	let anotherVar
	let port

	let pluginWindowIframe
	const html = document.querySelector('html')
	// @ts-ignore
	let url = `http://localhost:${window.runtimeData.port}`

	let ws = new WebSocket('ws://localhost:9001/ws')

	let isServerActive = true

	function checkUrlStatus(url) {
		return fetch(url)
			.then((response) => {
				// Check if the response status is within the range 200-299
				if (response.ok) {
					return 'URL is active'
				} else {
					throw new Error('URL is not active')
				}
			})
			.catch((error) => {
				return 'Error: ' + error.message
			})
	}

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
				ws.send(JSON.stringify(message))
				// console.log('Message sent:', message)
			} catch (error) {
				console.error('Failed to send message:', error)
			}
		}

		send()
	}

	// FIXME: Does this need changing so styles are applied as soon as url is changed, and the rest of the stuff loads when the iframe loads?
	async function redirectIframe() {
		return new Promise((resolve, reject) => {
			// Set the iframe source
			pluginWindowIframe.src = new URL(url).href

			// Listen for the iframe's load event
			pluginWindowIframe.onload = function () {
				console.log('Iframe successfully redirected to:', pluginWindowIframe.src)

				// Resolve the promise when the iframe is successfully loaded
				resolve('Iframe successfully redirected')
			}

			// Set a timeout in case the iframe fails to load after a certain time
			setTimeout(() => {
				reject(new Error('Iframe redirection timeout or failed'))
			}, 5000) // You can adjust the timeout duration as necessary
		})
	}

	function postToIframeAndWebSocket(type, data) {
		const message = {
			pluginMessage: {
				type,
				data,
			},
		}
		pluginWindowIframe.contentWindow.postMessage(message, '*')
		sendWsMessage(ws, message)
	}

	// Pass messages between parent and plugin window wrapper iframe
	function relayFigmaMessages() {
		window.onmessage = (event) => {
			if (event.origin === 'https://www.figma.com') {
				// forward to iframe and browser
				pluginWindowIframe.contentWindow.postMessage(event.data, '*')
				// console.log('main --> ui')
				sendWsMessage(ws, event.data)
			} else {
				// forward to main
				// console.log('main <-- ui', event.data)
				parent.postMessage(event.data, '*')
			}
		}

		ws.onmessage = (event) => {
			// forward to main
			const message = JSON.parse(event.data)
			// console.log('main <-- ui', JSON.parse(message))

			parent.postMessage(JSON.parse(message), '*')
		}
	}

	function sendFigmaClassesAndStyles() {
		const styleSheetElement = document.getElementById('figma-style')

		ws.addEventListener('message', (event) => {
			const message = JSON.parse(JSON.parse(event.data)).pluginMessage

			if (message.type === 'GET_FIGMA_CLASSES_AND_STYLES') {
				postToIframeAndWebSocket('FIGMA_HTML_CLASSES', html.className)
				postToIframeAndWebSocket('FIGMA_STYLES', styleSheetElement.innerHTML)
			}
		})
	}

	function observeChanges() {
		function observeFigmaClasses() {
			const observer = new MutationObserver((mutationsList) => {
				for (let mutation of mutationsList) {
					if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
						postToIframeAndWebSocket('FIGMA_HTML_CLASSES', html.className)
					}
				}
			})

			observer.observe(html, {
				attributes: true,
				attributeFilter: ['class'],
			})
		}

		function observeFigmaStyles() {
			const styleSheetElement = document.getElementById('figma-style')

			const observer = new MutationObserver(() => {
				postToIframeAndWebSocket('FIGMA_STYLES', styleSheetElement.innerHTML)
			})

			observer.observe(styleSheetElement, {
				attributes: true,
				childList: true,
				subtree: true,
			})

			// Send initial styles immediately
			postToIframeAndWebSocket('FIGMA_STYLES', styleSheetElement.innerHTML)
		}

		observeFigmaClasses()
		observeFigmaStyles()
	}

	// Remove padding and margin because app has it's own body tag
	function setBodyStyles() {
		document.body.style.padding = '0'
		document.body.style.margin = '0'
		document.body.style.color = 'var(--figma-color-text)'
		document.body.style.fontFamily = 'Inter, system-ui, Helvetica, Arial, sans-serif'
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

	onMount(async () => {
		setBodyStyles()
		let res = await checkUrlStatus(url)

		if (res !== 'URL is active') {
			isServerActive = false
		}
		await redirectIframe()

		relayFigmaMessages()
		observeChanges()

		// resizePluginWindow()
		sendFigmaClassesAndStyles()

		setInterval(async () => {
			let res = await checkUrlStatus(url)

			if (res !== 'URL is active') {
				isServerActive = false
			}
		}, 1000)
	})
</script>

{#if isServerActive}
	<iframe title="" id="vite-app-host" bind:this={pluginWindowIframe}></iframe>
{:else}
	<ServerStatus></ServerStatus>
{/if}

<style>
	#vite-app-host {
		width: 100%;
		height: 100vh;
		border: none;
	}
</style>
