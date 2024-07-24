<script>
	import Counter from './Counter.svelte';
	import welcome from '$lib/images/svelte-welcome.webp';
	import welcome_fallback from '$lib/images/svelte-welcome.png';

	export let data;
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<div class="Header fullwidth">
		<h1 class="Header_Name">Plugma</h1>
		<p class="Header_Tagline">CLI that simplifies creating Figma plugins</p>
		<a class="Button" href="https://github.com/gavinmcfarland/plugma">View on Github</a>
	</div>

	<div style="color: red" class="p-2">Hello</div>

	<div>
		<h2>Usage</h2>

		<div>
			{#each data.highlights as { svg, description }}
				<div>
					<span>
						{@html svg}
					</span>
					<p>{description}</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- {@html data.content} -->

	<!-- <Counter /> -->
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}

	.welcome {
		display: block;
		position: relative;
		width: 100%;
		height: 0;
		padding: 0 0 calc(100% * 495 / 2048) 0;
	}

	.welcome img {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		display: block;
	}
</style>
