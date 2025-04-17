<script lang="ts">
	
	interface Props {
		// Define optional props without default values
		title?: string | undefined;
		description?: string | undefined;
		url?: string | undefined;
		image?: string | undefined;
		siteName?: string | undefined;
		type?: string | undefined;
	}

	let {
		title = undefined,
		description = undefined,
		url = undefined,
		image = undefined,
		siteName = undefined,
		type = undefined
	}: Props = $props();
</script>

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

{#if siteName}
	<meta property="og:site_name" content={siteName} />
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
