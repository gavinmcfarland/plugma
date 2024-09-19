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
</script>

<div class="container">Vite app proxy</div>

<style>
	.container {
		/* keep background transparent to avoid flicker when changing theme in dev mode */
		color: var(--figma-color-text);
	}
</style>
