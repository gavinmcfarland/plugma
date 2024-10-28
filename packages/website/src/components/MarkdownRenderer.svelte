<script lang="ts">
	import { marked } from 'marked';
	import { SvelteComponent } from 'svelte';

	export let markdown: string = '';
	export let components: Record<string, typeof SvelteComponent> = {};

	let structuredMarkdown: {
		id: number;
		component: typeof SvelteComponent | string;
		props: Record<string, any>;
	}[] = [];

	let uniqueId = 0;

	// Map of token types to their respective HTML tags
	const tokenToTagMap = {
		paragraph: 'p',
		list_item: 'li',
		list: 'ul',
		strong: 'strong',
		em: 'em',
		del: 'del',
		blockquote: 'blockquote',
		link: 'a'
		// Add other mappings as needed
	};

	function parseMarkdown(content: string) {
		structuredMarkdown = [];
		uniqueId = 0;

		// Lex the Markdown content into tokens
		const tokens = marked.lexer(content);

		// Process each token individually
		for (const token of tokens) {
			const id = uniqueId++;

			switch (token.type) {
				case 'heading': {
					const componentTag = `h${token.depth}`;
					const content = marked.parseInline(token.text); // Parse inline elements
					if (components[componentTag]) {
						structuredMarkdown.push({
							id,
							component: components[componentTag],
							props: { level: token.depth, content }
						});
					} else {
						structuredMarkdown.push({
							id,
							component: `h${token.depth}`,
							props: { innerHTML: content }
						});
					}
					break;
				}

				case 'code': {
					if (components['code']) {
						structuredMarkdown.push({
							id,
							component: components['code'],
							props: {
								text: token.text,
								lang: token.lang || 'plaintext'
							}
						});
					} else {
						// Render as a <pre><code> block for standard Markdown code
						structuredMarkdown.push({
							id,
							component: 'pre',
							props: {
								innerHTML: `<code class="language-${token.lang || 'plaintext'}">${token.text}</code>`
							}
						});
					}
					break;
				}

				// case 'paragraph': {
				// 	const content = marked.parseInline(token.text); // Parse inline elements
				// 	structuredMarkdown.push({
				// 		id,
				// 		component: 'p',
				// 		props: { innerHTML: content }
				// 	});
				// 	break;
				// }

				case 'list': {
					const listTag = token.ordered ? 'ol' : 'ul';
					const items = token.items
						.map((item) => `<li>${marked.parseInline(item.text)}</li>`)
						.join('');
					structuredMarkdown.push({
						id,
						component: listTag,
						props: { innerHTML: items }
					});
					break;
				}

				default: {
					// Dynamically determine the HTML tag based on the token type
					const tag = tokenToTagMap[token.type] || 'div'; // Default to <div> if no mapping is found
					const content = marked.parser([token]); // Generate HTML content

					structuredMarkdown.push({
						id,
						component: tag,
						props: { innerHTML: content }
					});
					break;
				}
			}
		}
	}

	// Reactive statement that calls parseMarkdown when `markdown` changes
	$: parseMarkdown(markdown);
</script>

<!-- Render each item in structuredMarkdown separately -->
<div>
	{#each structuredMarkdown as { id, component, props } (id)}
		{#if typeof component === 'string'}
			{@html `<${component}>${props.innerHTML}</${component}>`}
			<!-- Render HTML element directly -->
		{:else}
			<svelte:component this={component} {...props} /> <!-- Render custom component -->
		{/if}
	{/each}
</div>
