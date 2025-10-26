<script lang="ts">
	import MarkdownIt from 'markdown-it';

	
	interface Props {
		// Define a prop for the Markdown content and a prop for the component map
		content?: string;
		components?: any;
	}

	let { content = '', components = {} }: Props = $props();

	// Create the `markdown-it` instance
	const md = new MarkdownIt();

	// Define custom rendering rules based on the component map keys
	for (const [tokenType, component] of Object.entries(components)) {
		md.renderer.rules[`${tokenType}_open`] = () => `<component-${tokenType}>`;
		md.renderer.rules[`${tokenType}_close`] = () => `</component-${tokenType}>`;
	}

	// Parse the markdown content into tokens
	const tokens = md.parse(content, {});
</script>

<div>
	{#each tokens as token}
		{#if components[token.type]}
			<!-- Render the Svelte component passed in for this token type -->
			{@const SvelteComponent = components[token.type]}
			<SvelteComponent content={token.content} />
		{:else}
			<!-- Render plain text directly -->
			{@html token.content}
		{/if}
	{/each}
</div>
