<script>
	import ServerStatus from "../shared/components/ServerStatus.svelte";
	import { monitorUrl } from "../shared/lib/monitorUrl";

	import { setBodyStyles } from "./lib/setBodyStyles";

	import { onMount } from "svelte";
	import { triggerDeveloperTools } from "../shared/lib/triggerDeveloperTools";
	import {
		isDeveloperToolsActive,
		isLocalhostWithoutPort,
	} from "../shared/stores";
	import Toolbar from "./components/Toolbar.svelte";
	import { monitorDeveloperToolsStatus } from "./lib/monitorDeveloperToolsStatus";
	import { getRoom } from "../shared/lib/getRoom";
	import { createClient } from "plugma/client";

	import { relayFigmaMessages } from "./lib/relayFigmaMessages";
	import { getClassesAndStyles } from "./lib/getClassesAndStyles";
	import { observeChanges } from "./lib/observeChanges";

	let iframe;
	const html = document.querySelector("html");

	// @ts-ignore
	let url = `http://localhost:${window.runtimeData.port}`;

	let isServerActive = true;

	onMount(async () => {
		// NOTE: Messaging must be setup first so that it's ready to receive messages from iframe
		// NOTE: Because source is not passed through it will appear as "unknown" in the client list
		// let ws = setupWebSocket(iframe, window.runtimeData.websockets);

		const wsClient = createClient({
			room: getRoom(),
			port: window.runtimeData.port,
		});

		// Move redirecting iframe higher up because some messages were not being recieved due to iframe not being redirected in time (do i need to consider queing messages?)
		iframe.src = new URL(url).href;
		relayFigmaMessages(wsClient);

		monitorUrl(url, iframe, (isActive) => {
			isServerActive = isActive;
		});
		setBodyStyles();
		await monitorDeveloperToolsStatus();
		await triggerDeveloperTools();
		// redirecting iframe used to be here
		// await redirectIframe(iframe, url)

		// Needs to occur without waiting for websocket to open
		observeChanges(wsClient);

		wsClient.on("connect", () => {
			// observeChanges(ws)
			getClassesAndStyles(wsClient);
		});
	});
</script>

{#if $isDeveloperToolsActive}
	<Toolbar />
{/if}

<iframe title="" id="vite-app-host" bind:this={iframe}></iframe>

<!-- needs to be in both FigmaBridge and DevServer, because if DevServer hasn't loaded, then no way to report error-->
{#if $isLocalhostWithoutPort}
	<ServerStatus message="Check dev console"></ServerStatus>
{:else if !isServerActive}
	<ServerStatus></ServerStatus>
{/if}

<style>
	#vite-app-host {
		width: 100%;
		/* height: 100vh; */
		flex-grow: 1;
		border: none;
		/* Prevents iframe from pushing out of plugin window */
		min-height: 0;
	}
</style>
