<script lang="ts">
	import { run } from 'svelte/legacy';

	import { onMount } from 'svelte'

	import { initializeWsClient } from '../shared/stores'

	import { monitorUrl } from '../shared/lib/monitorUrl'
	import { triggerDeveloperTools } from '../shared/lib/triggerDeveloperTools'
	import { getRoom } from '../shared/lib/getRoom'
	import { isFigmaConnected } from '../shared/stores'
	import { listenForFigmaStyles } from './lib/listenForFigmaStyles'
	import { getFigmaStyles } from './lib/getFigmaStyles'
	import { applyStoredStyles } from './lib/applyStoredStyles'
	import { interceptPostMessage } from './lib/interceptPostMessage'
	import { overrideMessageEvent } from './lib/overrideMessageEvent'
	import { reimplementFigmaListeners } from './lib/reimplementFigmaListeners'
	import { interceptDragEnd } from './lib/interceptDragEnd'
	import ServerStatus from '../shared/components/ServerStatus.svelte'

	const isInsideIframe = window.self !== window.top

	// Initialize connection state based on context
	if (isInsideIframe) {
		// If we're inside an iframe, we're running inside Figma, so we're connected
		isFigmaConnected.set(true)
	}

	// Default to true to avoid flickering when browser first opens
	let isWebsocketServerActive = $state(true)
	let isWebsocketsEnabled = window.runtimeData.websockets || false
	let isServerActive = $state(false)

	// @ts-ignore
	let devServerUIUrl = `http://localhost:${window.runtimeData.port}`

	interface RoomStats {
		room: string
		connections: number
	}

	let lastConnectionState = false
	let debounceTimeout: ReturnType<typeof setTimeout>

	function handleRoomStats(data: RoomStats[]) {
		console.log('handleRoomStats', data)
		const figmaRoom = data.find((room) => room.room === 'figma')

		if (!figmaRoom) {
			console.log('figma disconnected - no figma room found')
			updateConnectionState(false)
			return
		}

		const isConnected = figmaRoom.connections > 0
		console.log(isConnected ? 'figma connected' : 'figma disconnected')
		updateConnectionState(isConnected)
	}

	function updateConnectionState(isConnected: boolean) {
		// Clear any existing timeout
		if (debounceTimeout) {
			clearTimeout(debounceTimeout)
		}

		// Only update if the state is different from the last state
		// To prevent flickering when plugin reopens due to hot reloading
		if (isConnected !== lastConnectionState) {
			debounceTimeout = setTimeout(() => {
				isFigmaConnected.set(isConnected)
				lastConnectionState = isConnected
			}, 200) // 2 second delay
		}
	}

	// In the browser context
	if (!isInsideIframe) {
		const socket = initializeWsClient(getRoom(), window.runtimeData.port)

		socket.on('connect', () => {
			console.log('Socket connected!!!', socket.id)
			isWebsocketServerActive = true
			getFigmaStyles()
		})

		socket.on('ROOM_STATS', handleRoomStats)

		socket.on('disconnect', () => {
			console.log('Socket disconnected!!!', socket.id)
			isWebsocketServerActive = false
		})
	}

	listenForFigmaStyles()
	applyStoredStyles()
	reimplementFigmaListeners()

	interceptPostMessage() // Only applies to browser preview context
	overrideMessageEvent() // Only applies to browser preview context
	// interceptDragEnd() // REVIEW: disabled for now because might not be very robust

	run(() => {
		monitorUrl(devServerUIUrl, (isDevServerActive: boolean) => {
			isServerActive = isDevServerActive
		})
	});

	onMount(async () => {
		await triggerDeveloperTools()
	})
</script>

{#if !isInsideIframe}
	{#if isServerActive}
		<!-- FIXME: When websockets enabled via test command, this should enable?-->
		{#if !isWebsocketsEnabled}
			<ServerStatus message="Websockets disababled" isConnected={isServerActive && isWebsocketServerActive} />
		{:else if !isWebsocketServerActive}
			<ServerStatus
				message="Connecting to websocket server..."
				isConnected={isServerActive && isWebsocketServerActive}
			/>
		{:else if !$isFigmaConnected}
			<ServerStatus message="Open plugin inside Figma" isConnected={isServerActive && isWebsocketServerActive} />
		{/if}
	{:else}
		<ServerStatus isConnected={isServerActive && isWebsocketServerActive} />
	{/if}
{/if}
