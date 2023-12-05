<script lang="ts">
	import { onMount } from "svelte";
	import App from "../App.svelte";

	onMount(() => {
		loadFigmaStyles();
		startWebSocket();
	});
</script>

<span bind:this={isConnected}>(connected ?)</span>

<App />
