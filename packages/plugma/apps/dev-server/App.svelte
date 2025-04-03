<script lang="ts">
	import { onMount } from 'svelte'

	// @ts-ignore
	import { createClient } from 'plugma/client'

	import { pluginWindowClients, initializeWsClient } from '../shared/stores'

	import { monitorUrl } from '../shared/lib/monitorUrl'
	import { triggerDeveloperTools } from '../shared/lib/triggerDeveloperTools'
	import { getRoom } from '../shared/lib/getRoom'

	import { listenForFigmaStyles } from './lib/listenForFigmaStyles'
	import { getFigmaStyles } from './lib/getFigmaStyles'
	import { applyStoredStyles } from './lib/applyStoredStyles'
	import { interceptPostMessage } from './lib/interceptPostMessage'
	import { overrideMessageEvent } from './lib/overrideMessageEvent'
	import { reimplementFigmaListeners } from './lib/reimplementFigmaListeners'

	import ServerStatus from '../shared/components/ServerStatus.svelte'

	const html = document.querySelector('html')

	const isInsideIframe = window.self !== window.top

	let isWebsocketServerActive = false
	let isWebsocketsEnabled = window.runtimeData.websockets || false
	let isServerActive = false

	// @ts-ignore
	let devServerUIUrl = `http://localhost:${window.runtimeData.port}`

	if (!isInsideIframe) {
		const socket = initializeWsClient(getRoom(), window.runtimeData.port)

		socket.on('connect', () => {
			console.log('Socket connected!!!', socket.id)
			isWebsocketServerActive = true
			getFigmaStyles()
		})

		socket.emit('GET_FIGMA_STYLES', (response: any) => {
			console.log('Received styles:', response)
		})

		socket.on('disconnect', () => {
			console.log('Socket disconnected!!!', socket.id)
			isWebsocketServerActive = false
		})
	}

	listenForFigmaStyles()
	applyStoredStyles()
	reimplementFigmaListeners()

	interceptPostMessage() // Only applies to browser preview context
	overrideMessageEvent()

	$: monitorUrl(devServerUIUrl, (isDevServerActive: boolean) => {
		isServerActive = isDevServerActive
	})

	onMount(async () => {
		await triggerDeveloperTools()
	})
</script>

<!-- {#if !isInsideIframe}
	{#if isServerActive}
		{#if !isWebsocketsEnabled}
			<ServerStatus message="Websockets disababled" isConnected={isServerActive && isWebsocketServerActive} />
		{:else if !isWebsocketServerActive}
			<ServerStatus
				message="Connecting to websocket server..."
				isConnected={isServerActive && isWebsocketServerActive}
			/>
		{:else if $pluginWindowClients.length < 1}
			<ServerStatus message="Open plugin inside Figma" isConnected={isServerActive && isWebsocketServerActive} />
		{/if}
	{:else}
		<ServerStatus isConnected={isServerActive && isWebsocketServerActive} />
	{/if}
{/if} -->
