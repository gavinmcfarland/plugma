<script>
	import { nanoid } from 'nanoid'
	import ServerStatus from './lib/ServerStatus.svelte'
	import { monitorUrl } from '../../shared/monitorUrl'
	import { setBodyStyles } from '../../shared/setBodyStyles'
	import { redirectIframe } from '../../shared/redirectIframe'
	import { resizePluginWindow } from '../../shared/resizePluginWindow'
	import { setupWebSocket } from '../../shared/setupWebSocket'

	import { onMount } from 'svelte'

	let iframe
	const html = document.querySelector('html')

	// @ts-ignore
	let url = `http://localhost:${window.runtimeData.port}`

	let isServerActive = true

	// Pass messages between parent and plugin window wrapper iframe
	function relayFigmaMessages(ws) {
		ws.on((event) => {
			if (event.origin === 'https://www.figma.com') {
				// forward to iframe and browser
				ws.post(event.data, ['iframe', 'ws'])
			} else {
				// forward to main
				ws.post(event.data, ['parent', 'ws'])
			}
		}, 'window')

		ws.on((event) => {
			console.log('---- on ws', event.data)
			ws.post(event.data, 'parent')
		}, 'ws')
	}

	function getClassesAndStyles(ws) {
		const styleSheetElement = document.getElementById('figma-style')

		ws.on((event) => {
			const message = event.data.pluginMessage

			if (message.type === 'GET_FIGMA_CLASSES_AND_STYLES') {
				const messages = [
					{
						pluginMessage: {
							type: 'FIGMA_HTML_CLASSES',
							data: html.className,
						},
					},
					{
						pluginMessage: {
							type: 'FIGMA_STYLES',
							data: styleSheetElement.innerHTML,
						},
					},
				]
				ws.post(messages, ['iframe', 'ws'])
			}
		}, 'ws')
	}

	function observeChanges(ws) {
		function postMessage(type, data) {
			ws.post(
				{
					pluginMessage: {
						type,
						data,
					},
					pluginId: '*',
				},
				['iframe', 'ws'],
			)
		}

		function createObserver(target, messageType, getData) {
			// Post initial data
			postMessage(messageType, getData())

			const observer = new MutationObserver(() => {
				postMessage(messageType, getData())
			})

			observer.observe(target, {
				attributes: true,
				childList: true,
				subtree: true,
			})
		}

		const styleSheetElement = document.getElementById('figma-style')
		createObserver(html, 'FIGMA_HTML_CLASSES', () => html.className)
		createObserver(styleSheetElement, 'FIGMA_STYLES', () => styleSheetElement.innerHTML)
	}

	onMount(async () => {
		monitorUrl(url, iframe, (isActive) => {
			isServerActive = isActive
		})
		setBodyStyles()

		await redirectIframe(iframe, url)

		let ws = setupWebSocket(iframe)

		ws.open(() => {
			console.log('----- ws reconnecting')
			relayFigmaMessages(ws)
			observeChanges(ws)
			getClassesAndStyles(ws)
		})
	})
</script>

<iframe title="" id="vite-app-host" bind:this={iframe}></iframe>

<!-- should dev server status be in VITE_APP?-->
{#if !isServerActive}
	<ServerStatus></ServerStatus>
{/if}

<style>
	#vite-app-host {
		width: 100%;
		height: 100vh;
		border: none;
	}
</style>
