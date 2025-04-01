<script lang="ts">
	import { onMount } from "svelte";

	// @ts-ignore
	import { createClient } from "plugma/client";

	import { pluginWindowClients } from "../shared/stores";

	import { monitorUrl } from "../shared/lib/monitorUrl";
	import { triggerDeveloperTools } from "../shared/lib/triggerDeveloperTools";
	import { getRoom } from "../shared/lib/getRoom";

	import { listenForFigmaStyles } from "./lib/listenForFigmaStyles";
	import { getFigmaStyles } from "./lib/getFigmaStyles";
	import { applyStoredStyles } from "./lib/applyStoredStyles";
	import { interceptPostMessage } from "./lib/interceptPostMessage";
	import { overrideMessageEvent } from "./lib/overrideMessageEvent";
	import { reimplementFigmaListeners } from "./lib/reimplementFigmaListeners";

	import ServerStatus from "../shared/components/ServerStatus.svelte";

	const html = document.querySelector("html");

	const isInsideIframe = window.self !== window.top;

	let isWebsocketServerActive = false;
	let isWebsocketsEnabled = window.runtimeData.websockets || false;
	let isServerActive = false;

	// let ws = setupWebSocket(null, window.runtimeData.websockets, true);
	let wsClient = createClient({
		room: getRoom(),
		port: window.runtimeData.port,
	});

	let url = `http://localhost:${window.runtimeData.port}`;

	reimplementFigmaListeners();
	interceptPostMessage();
	overrideMessageEvent();
	listenForFigmaStyles(wsClient);
	applyStoredStyles(html);

	wsClient.on("connect", () => {
		isWebsocketServerActive = true;
		getFigmaStyles();
	});

	wsClient.on("disconnect", () => {
		isWebsocketServerActive = false;
	});

	$: monitorUrl(url, null, (isActive) => {
		isServerActive = isActive;
	});

	onMount(async () => {
		await triggerDeveloperTools();
	});
</script>

{#if !isInsideIframe}
	{#if isServerActive}
		{#if !isWebsocketsEnabled}
			<ServerStatus
				message="Websockets disababled"
				isConnected={isServerActive && isWebsocketServerActive}
			/>
		{:else if !isWebsocketServerActive}
			<ServerStatus
				message="Connecting to websocket server..."
				isConnected={isServerActive && isWebsocketServerActive}
			/>
		{:else if $pluginWindowClients.length < 1}
			<ServerStatus
				message="Open plugin inside Figma"
				isConnected={isServerActive && isWebsocketServerActive}
			/>
		{/if}
	{:else}
		<ServerStatus isConnected={isServerActive && isWebsocketServerActive} />
	{/if}
{/if}
