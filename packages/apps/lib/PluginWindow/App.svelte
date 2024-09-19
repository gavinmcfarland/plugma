<script type="module">
	import { onMount } from 'svelte'
	let pluginWindowIframe
	const figmaOrigin = 'https://www.figma.com'
	const html = document.querySelector('html');

	function postMessage(type, data, target) {
		target.postMessage(
			{
				type,
				data,
			},
			'*',
		)
	}

	// Redirect iframe to a new URL
	function redirectIframe() {
		pluginWindowIframe.src = new URL('http://localhost:5173').href
	}

	// Pass messages between parent and plugin window wrapper iframe
	function relayMessages() {
		window.onmessage = (event) => {
			if (event.origin === 'https://www.figma.com') {
				console.log('post downwards')
				// pluginWindowIframe.contentWindow.postMessage(event.data, "*")
			} else {
				console.log('post upwards')
				parent.postMessage(event.data, '*')
			}
		}
	}
	function observeChanges() {
		function postFigmaClasses() {
			const observer = new MutationObserver((mutationsList) => {
				for (let mutation of mutationsList) {
					if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
						// Post the message to the iframe
						postMessage('FIGMA_HTML_CLASSES', html.className, pluginWindowIframe.contentWindow)
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
				postMessage('FIGMA_STYLES', styleSheetElement.innerHTML, pluginWindowIframe.contentWindow)
			})

			// Start observing the <style> or <link> element for changes
			observer.observe(styleSheetElement, {
				attributes: true,
				childList: true,
				subtree: true,
			})

			// Optionally, call postUpdatedStyles immediately to send the initial styles
			postMessage('FIGMA_STYLES', styleSheetElement.innerHTML, pluginWindowIframe.contentWindow)
		}

		// Wait for the iframe to be mounted
		pluginWindowIframe.onload = () => {
			postFigmaClasses()
			postFigmaStyles()
		}
	}




	onMount(() => {
		redirectIframe()
		relayMessages()
		observeChanges()
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