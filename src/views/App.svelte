<script lang="ts">
	import svelteLogo from "../assets/svelte.svg";
	import viteLogo from "../assets/vite.svg";
	import Counter from "../lib/Counter.svelte";

	let nodes: any = [];

	window.onmessage = (msg) => {
		if (
			msg.data.pluginMessage &&
			msg.data.pluginMessage.event === "selected-text-nodes"
		) {
			nodes = msg.data.pluginMessage.nodes;
		}
	};
</script>

<main>
	<ul>
		{#each nodes as node}
			<li>{node.text}</li>
		{/each}
	</ul>
	<div>
		<a href="https://vitejs.dev" target="_blank" rel="noreferrer">
			<!-- <img src={viteLogo} class="logo" alt="Vite Logo" /> -->
			{@html viteLogo}
		</a>
		<a href="https://svelte.dev" target="_blank" rel="noreferrer">
			<!-- <img src={svelteLogo} class="logo svelte" alt="Svelte Logo" /> -->
			{@html svelteLogo}
		</a>
	</div>
	<h1>Vite</h1>

	<div class="card">
		<Counter />
	</div>

	<p>
		Check out <a
			href="https://github.com/sveltejs/kit#readme"
			target="_blank"
			rel="noreferrer">SvelteKit</a
		>, the official Svelte app framework powered by Vite!
	</p>

	<p class="read-the-docs">
		Click on the Vite and Svelte logos to learn more
	</p>
</main>

<style>
	.logo {
		height: 6em;
		padding: 1.5em;
		will-change: filter;
		transition: filter 300ms;
	}
	.logo:hover {
		filter: drop-shadow(0 0 2em #646cffaa);
	}
	.logo.svelte:hover {
		filter: drop-shadow(0 0 2em #ff3e00aa);
	}
	.read-the-docs {
		color: #888;
	}
</style>
