<script lang="ts">
	import { onMount } from "svelte";
	import { catchFigmaStyles } from "../common/ui/catchFigmaStyles";
	import { startWebSocketServer } from "../common/ui/startWebSocketServer";
	import App from "../../../../src/App.svelte";

	onMount(() => {
		catchFigmaStyles();
		startWebSocketServer();
	});
</script>

<!-- <span bind:this={isConnected}>(connected ?)</span> -->

<App />
