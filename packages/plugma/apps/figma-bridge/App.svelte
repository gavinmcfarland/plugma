<script lang="ts">
	import ServerStatus from "../shared/components/ServerStatus.svelte";
	import { monitorUrl } from "../shared/lib/monitorUrl";
	// import { initializeWsClient } from "../shared/stores";
	import io from "socket.io-client";

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

	// @ts-ignore
	// import { createClient } from "plugma/client";

	import { relayFigmaMessages } from "./lib/relayFigmaMessages";
	import { getClassesAndStyles } from "./lib/getClassesAndStyles";
	import { observeChanges } from "./lib/observeChanges";
	import { redirectIframe } from "./lib/redirectIframe";
	import { devServerIframe } from "../shared/stores";
	let iframe: HTMLIFrameElement;
	const html = document.querySelector("html");

	// @ts-ignore
	let url = `http://localhost:${window.runtimeData.port}`;

	let isServerActive = true;

	onMount(async () => {
		// Store the iframe on mount
		devServerIframe.set(iframe);
		// NOTE: Messaging must be setup first so that it's ready to receive messages from iframe
		// NOTE: Because source is not passed through it will appear as "unknown" in the client list
		// const wsClient = initializeWsClient(getRoom(), window.runtimeData.port);

		// console.log("wsClient", wsClient.connected);

		// wsClient.on("connect", () => {
		// 	console.log("Socket connected!", wsClient.id);
		// });

		const wsUrl = `ws://localhost:${Number(window.runtimeData.port + 1)}`;

		console.log("wsUrl", wsUrl);

		const socket = io(wsUrl, {
			path: "/",
			transports: ["websocket"],
			auth: { room: getRoom() },
		});

		socket.on("connect", () => {
			console.log("Socket connected!", socket.id);
		});

		// Move redirecting iframe higher up because some messages were not being recieved due to iframe not being redirected in time (do i need to consider queing messages?)
		// redirectIframe(url);
		// relayFigmaMessages(wsClient);

		// monitorUrl(url, iframe, (isActive) => {
		// 	isServerActive = isActive;
		// });
		// setBodyStyles();
		// await monitorDeveloperToolsStatus();
		// await triggerDeveloperTools();
		// // redirecting iframe used to be here
		// // await redirectIframe(iframe, url)

		// // Needs to occur without waiting for websocket to open
		// observeChanges(wsClient);

		// wsClient.on("connect", () => {
		// 	// observeChanges(ws)
		// 	getClassesAndStyles(wsClient);
		// });
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
