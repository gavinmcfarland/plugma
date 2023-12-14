<script lang="ts">
	import { onMount } from "svelte";
	import { catchFigmaStyles } from "plugma/frameworks/common/ui/catchFigmaStyles";
	import { startWebSocketServer } from "plugma/frameworks/common/ui/startWebSocketServer";
	import App from "../../../../src/App.svelte";

	let isConnected: any;

	onMount(() => {
		catchFigmaStyles();
		startWebSocketServer();
	});
</script>

<p>Preview Wrapper</p>

<!-- <span bind:this={isConnected}>(connected ?)</span> -->

<App />
