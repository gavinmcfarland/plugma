<script lang="ts">
	import ServerStatus from '../shared/components/ServerStatus.svelte'
	import { monitorUrl } from '../shared/lib/monitorUrl'
	import { initializeWsClient, isBrowserConnected } from '../shared/stores'
	import io from 'socket.io-client'

	import { setBodyStyles } from './lib/setBodyStyles'

	import { onMount } from 'svelte'
	import { triggerDeveloperTools } from '../shared/lib/triggerDeveloperTools'
	import { isDeveloperToolsActive, isLocalhostWithoutPort, wsEnabled, htmlStore } from '../shared/stores'
	import Toolbar from './components/Toolbar.svelte'
	import { monitorDeveloperToolsStatus } from './lib/monitorDeveloperToolsStatus'
	import { getRoom } from '../shared/lib/getRoom'

	// @ts-ignore
	// import { createClient } from "plugma/client";

	import { relayFigmaMessages } from './lib/relayFigmaMessages'
	import { observeAndPostFigmaStyles } from './lib/observeAndPostFigmaStyles'
	import { postFigmaStyles } from './lib/postFigmaStyles'
	import { redirectIframe } from './lib/redirectIframe'
	import { devServerIframe } from '../shared/stores'
	let iframe: HTMLIFrameElement
	const html = document.querySelector('html')

	// @ts-ignore
	let devServerUIUrl = `http://localhost:${window.runtimeData.port}`

	let isServerActive = true

	wsEnabled.set(window.runtimeData.websockets)

	onMount(async () => {
		// Store the iframe on mount
		devServerIframe.set(iframe)
		htmlStore.set(document)

		// NOTE: Messaging must be setup first so that it's ready to receive messages from iframe
		// NOTE: Because source is not passed through it will appear as "unknown" in the client list
		const socket = initializeWsClient(getRoom(), window.runtimeData.port)

		// Add room connection detection
		socket.on('ROOM_JOINED', (room: any) => {
			console.log('ROOM_JOINED', room)
			if (room === 'browser') {
				isBrowserConnected.set(true)
			}
		})

		socket.on('ROOM_LEFT', (room: any) => {
			if (room === 'browser') {
				isBrowserConnected.set(false)
			}
		})

		redirectIframe(devServerUIUrl)
		setBodyStyles()
		relayFigmaMessages()
		postFigmaStyles()

		// For some reason messages sent from figma bridge to iframe are missed by the iframe message handler if we don't wait for the iframe to load
		iframe.addEventListener('load', () => {
			observeAndPostFigmaStyles()
		})

		monitorUrl(devServerUIUrl, (isDevServerActive: boolean) => {
			isServerActive = isDevServerActive
		})

		await monitorDeveloperToolsStatus()
		await triggerDeveloperTools()
	})
</script>

{#if $isDeveloperToolsActive}
	<Toolbar />
{/if}

<iframe title="" id="dev-server-ui" bind:this={iframe}></iframe>

<!-- needs to be in both FigmaBridge and DevServer, because if DevServer hasn't loaded, then no way to report error-->
{#if $isLocalhostWithoutPort}
	<ServerStatus message="Check dev console"></ServerStatus>
{:else if !isServerActive}
	<ServerStatus></ServerStatus>
{/if}

<style>
	#dev-server-ui {
		width: 100%;
		/* height: 100vh; */
		flex-grow: 1;
		border: none;
		/* Prevents iframe from pushing out of plugin window */
		min-height: 0;
	}
</style>
