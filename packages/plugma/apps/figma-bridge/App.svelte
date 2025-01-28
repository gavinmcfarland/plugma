<script>
	import ServerStatus from "../shared/components/ServerStatus.svelte";
	import { monitorUrl } from "../shared/lib/monitorUrl";
	import { setupWebSocket } from "../shared/lib/setupWebSocket";
	import { setBodyStyles } from "./lib/setBodyStyles";

	import { onMount } from "svelte";
	import { triggerDeveloperTools } from "../shared/lib/triggerDeveloperTools";
	import {
		isDeveloperToolsActive,
		isLocalhostWithoutPort,
	} from "../shared/stores";
	import Toolbar from "./components/Toolbar.svelte";
	import { monitorDeveloperToolsStatus } from "./lib/monitorDeveloperToolsStatus";

	let iframe;
	const html = document.querySelector("html");

	// @ts-ignore
	let url = `http://localhost:${window.runtimeData.port}`;

	let isServerActive = true;

	// Pass messages between parent and plugin window wrapper iframe
	function relayFigmaMessages(ws) {
		ws.on((event) => {
			if (event.origin === "https://www.figma.com") {
				// forward to iframe and browser
				ws.post(event.data, ["iframe", "ws"]);
			} else {
				// forward to main
				ws.post(event.data, ["parent"]);
			}
		}, "window");

		ws.on((event) => {
			// TODO: Filter out messages sent by framework
			ws.post(event.data, "parent");
		}, "ws");
	}

	function getClassesAndStyles(ws) {
		const styleSheetElement = document.getElementById("figma-style");

		if (styleSheetElement) {
			ws.on((event) => {
				const message = event.data.pluginMessage;

				if (message.type === "GET_FIGMA_CLASSES_AND_STYLES") {
					const messages = [
						{
							pluginMessage: {
								type: "FIGMA_HTML_CLASSES",
								data: html.className,
							},
						},
						{
							pluginMessage: {
								type: "FIGMA_STYLES",
								data: styleSheetElement.innerHTML,
							},
						},
					];
					ws.post(messages, ["iframe", "ws"]);
				}
			}, "ws");
		}
	}

	function observeChanges(ws) {
		const styleSheetElement = document.getElementById("figma-style");

		if (styleSheetElement) {
			function postMessage(type, data) {
				ws.post(
					{
						pluginMessage: {
							type,
							data,
						},
						pluginId: "*",
					},
					["iframe", "ws"],
				);
			}

			function createObserver(target, messageType, getData) {
				// Post initial data
				postMessage(messageType, getData());

				const observer = new MutationObserver(() => {
					postMessage(messageType, getData());
				});

				observer.observe(target, {
					attributes: true,
					childList: true,
					subtree: true,
				});
			}

			createObserver(html, "FIGMA_HTML_CLASSES", () => html.className);
			createObserver(
				styleSheetElement,
				"FIGMA_STYLES",
				() => styleSheetElement.innerHTML,
			);
		}
	}

	onMount(async () => {
		// NOTE: Messaging must be setup first so that it's ready to receive messages from iframe
		let ws = setupWebSocket(iframe, window.runtimeData.websockets);

		// Move redirecting iframe higher up because some messages were not being recieved due to iframe not being redirected in time (do i need to consider queing messages?)
		iframe.src = new URL(url).href;
		relayFigmaMessages(ws);

		monitorUrl(url, iframe, (isActive) => {
			isServerActive = isActive;
		});
		setBodyStyles();
		await monitorDeveloperToolsStatus();
		await triggerDeveloperTools();
		// redirecting iframe used to be here
		// await redirectIframe(iframe, url)

		// Needs to occur without waiting for websocket to open
		observeChanges(ws);

		ws.open(() => {
			// observeChanges(ws)
			getClassesAndStyles(ws);
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
