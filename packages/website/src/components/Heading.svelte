<script>
	import Icon from './Icon.svelte';

	export let depth = 1;
	export let text = '';

	function slugify(text) {
		return text
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^\w-]+/g, '');
	}

	let id = slugify(text);
</script>

{#if depth === 1}
	<h1 class="my-heading"><span class="text">{@html text}</span></h1>
{:else if depth === 2}
	<h2 class="my-heading" {id}>
		<span class="anchor-link"
			><a href={'#' + id} aria-label="Anchor link"><Icon svg="link" size={24} /></a></span
		>
		<span class="text">{@html text}</span>
	</h2>
{:else if depth === 3}
	<h3 class="my-heading" {id}>
		<span class="anchor-link"
			><a href={'#' + id} aria-label="Anchor link"><Icon svg="link" size={24} /></a></span
		>
		<span class="text">{text}</span>
	</h3>
{:else if depth === 4}
	<h4 class="my-heading" {id}>
		<span class="anchor-link"
			><a href={'#' + id} aria-label="Anchor link"><Icon svg="link" size={24} /></a></span
		>
		<span class="text">{@html text}</span>
	</h4>
{:else if depth === 5}
	<h5 class="my-heading" {id}>
		<span class="anchor-link"
			><a href={'#' + id} aria-label="Anchor link"><Icon svg="link" size={24} /></a></span
		>
		<span class="text">{@html text}</span>
	</h5>
{:else if depth === 6}
	<h6 class="my-heading" {id}>
		<span class="anchor-link"
			><a href={'#' + id} aria-label="Anchor link"><Icon svg="link" size={24} /></a></span
		>
		<span class="text">{@html text}</span>
	</h6>
{/if}

<style>
	h1,
	h2,
	h3,
	h4,
	h5,
	h6 {
		position: relative;
	}
</style>
