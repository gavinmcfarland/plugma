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

	// Use individual props instead of destructuring
	const props = $props<Props>();
</script>

<!-- Primary Meta Tags -->
{#if props.title}
	<meta name="title" content={props.title} />
{/if}
{#if props.description}
	<meta name="description" content={props.description} />
{/if}

<!-- Open Graph / Facebook -->
{#if props.url}
	<meta property="og:url" content={props.url} />
{/if}
{#if props.title}
	<meta property="og:title" content={props.title} />
{/if}
{#if props.description}
	<meta property="og:description" content={props.description} />
{/if}
{#if props.image}
	<meta property="og:image" content={props.image} />
{/if}

{#if props.siteName}
	<meta property="og:site_name" content={props.siteName} />
{/if}

{#if props.type}
	<meta property="og:type" content={props.type} />
{/if}

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
{#if props.url}
	<meta property="twitter:url" content={props.url} />
{/if}
{#if props.title}
	<meta property="twitter:title" content={props.title} />
{/if}
{#if props.description}
	<meta property="twitter:description" content={props.description} />
{/if}
{#if props.image}
	<meta property="twitter:image" content={props.image} />
{/if}
