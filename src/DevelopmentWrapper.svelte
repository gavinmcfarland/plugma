<script lang="ts">
	import { onMount } from "svelte";
	import App from "./views/App.svelte";

	const ws: any = {};
	let isConnected: any;

	const onWindowMsg = (msg: any) => {
		if (msg.data.pluginMessage) {
			const message = JSON.stringify(msg.data.pluginMessage);

			if (ws.current.readyState === 1) {
				// console.log("sent", message);
				ws.current.send(message);
			} else {
				setTimeout(() => {
					onWindowMsg(msg);
				}, 1000);
			}
		}
	};

	const startWebSocket = () => {
		ws.current = new WebSocket("ws://localhost:9001/ws");
		ws.current.onopen = () => {
			console.log("ws opened");
			// setIsConnected(true);
			isConnected.textContent = "Is connected";
		};
		ws.current.onclose = () => {
			console.log("ws closed");
			// setIsConnected(false);
			isConnected.textContent = "Not connected";

			setTimeout(() => {
				startWebSocket();
			}, 3000);
		};

		ws.current.onmessage = (event: any) => {
			try {
				let msg = JSON.parse(event.data);
				if (msg.src === "server") {
					let temp = JSON.parse(msg.message);
					window.parent.postMessage(
						{
							pluginMessage: temp,
							pluginId: "*",
						},
						"*"
					);
				}
			} catch (err) {
				console.error("not a valid message", err);
			}
			// return false;
		};

		window.addEventListener("message", onWindowMsg);

		return () => {
			ws.current.close();
			window.removeEventListener("message", onWindowMsg);
		};
	};

	parent.postMessage(
		{
			pluginMessage: {
				event: "get-figma-stylesheet",
			},
			pluginId: "*",
		},
		"*"
	);

	onMount(() => {
		const onWindowMsg2 = (msg: any) => {
			// We listen for message to add figma styles during development
			const message = msg.data.pluginMessage;
			if (message && message.event === "pass-figma-stylesheet") {
				document.styleSheets[0].insertRule(message.styles);
				window.removeEventListener("message", onWindowMsg2);
			}
		};
		window.addEventListener("message", onWindowMsg2);

		startWebSocket();
	});
</script>

<span bind:this={isConnected}>(connected ?)</span>

<App />

<style>
</style>
