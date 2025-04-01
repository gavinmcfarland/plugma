<script>
	import { onMount } from "svelte";

	import ServerStatus from "../shared/components/ServerStatus.svelte";
	import { monitorUrl } from "../shared/lib/monitorUrl";
	import { pluginWindowClients } from "../shared/stores";

	import { setupWebSocket } from "../shared/lib/setupWebSocket";
	import { triggerDeveloperTools } from "../shared/lib/triggerDeveloperTools";
	import { createClient } from "plugma/client";

	import { listenForFigmaStyles } from "./lib/listenForFigmaStyles";
	import { getFigmaStyles } from "./lib/getFigmaStyles";
	import { applyStoredStyles } from "./lib/applyStoredStyles";
	import { interceptPostMessage } from "./lib/interceptPostMessage";
	import { overrideMessageEvent } from "./lib/overrideMessageEvent";
	import { reimplementFigmaListeners } from "./lib/reimplementFigmaListeners";

	import { getRoom } from "../shared/lib/getRoom";

	const html = document.querySelector("html");

	const isInsideIframe = window.self !== window.top;
	const isInsideFigma = typeof figma !== "undefined";

	let message = null;
	let isWebsocketServerActive = false;
	let isWebsocketsEnabled = window.runtimeData.websockets || false;
	let isServerActive = false;

	// let ws = setupWebSocket(null, window.runtimeData.websockets, true);
	let wsClient = createClient({
		room: getRoom(),
		port: window.runtimeData.port,
	});

	let url = `http://localhost:${window.runtimeData.port}`;

	const processedMessages = new Set();

	// listenForWebSocketMessage()
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

{#if !(isInsideIframe || isInsideFigma)}
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
