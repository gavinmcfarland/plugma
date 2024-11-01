<script lang="ts">
	// Define optional props without default values
	export let title: string | undefined = undefined;
	export let description: string | undefined = undefined;
	export let url: string | undefined = undefined;
	export let image: string | undefined = undefined;
	export let type: string | undefined = undefined;
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	{#if title}
		<meta name="title" content={title} />
	{/if}
	{#if description}
		<meta name="description" content={description} />
	{/if}

	<!-- Open Graph / Facebook -->
	{#if url}
		<meta property="og:url" content={url} />
	{/if}
	{#if title}
		<meta property="og:title" content={title} />
	{/if}
	{#if description}
		<meta property="og:description" content={description} />
	{/if}
	{#if image}
		<meta property="og:image" content={image} />
	{/if}

	{#if type}
		<meta property="og:type" content={type} />
	{/if}

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	{#if url}
		<meta property="twitter:url" content={url} />
	{/if}
	{#if title}
		<meta property="twitter:title" content={title} />
	{/if}
	{#if description}
		<meta property="twitter:description" content={description} />
	{/if}
	{#if image}
		<meta property="twitter:image" content={image} />
	{/if}
</svelte:head>
