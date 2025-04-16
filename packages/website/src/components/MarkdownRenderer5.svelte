<script lang="ts">
	import { marked } from 'marked';
	import { SvelteComponent } from 'svelte';

	export let markdown: string = '';
	export let components: Record<string, typeof SvelteComponent> = {};

	let structuredMarkdown: {
		id: number;
		component: typeof SvelteComponent | string | null;
		props: Record<string, any>;
	}[] = [];

	let uniqueId = 0;

	// Helper to create slugs from headings
	function slugify(text: string): string {
		return text
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^\w-]+/g, '');
	}

	function parseAttributes(attributeString: string): Record<string, string> {
		const attrs: Record<string, string> = {};
		const matches = attributeString.match(/(\w+)="([^"]*?)"/g) || [];

		matches.forEach((match) => {
			const [key, value] = match.split('=');
			attrs[key.trim()] = value.replace(/"/g, '').trim();
		});

		return attrs;
	}

	function parseMarkdown(markdownText: string) {
		if (!markdownText) {
			structuredMarkdown = [];
			return;
		}

		const tokens = marked.lexer(markdownText);
		const parsed: typeof structuredMarkdown = [];

		for (const token of tokens) {
			const id = uniqueId++;

			if (token.type === 'html') {
				// Extract component name and check if it's a custom component
				const componentNameMatch = token.raw.match(/<(\w+)(?:\s|>|$)/);
				if (componentNameMatch && components[componentNameMatch[1]]) {
					const componentName = componentNameMatch[1];

					// Extract attributes and content
					const openingTagMatch = token.raw.match(
						new RegExp(`<${componentName}([^>]*)>`)
					);
					const attributes = openingTagMatch ? openingTagMatch[1].trim() : '';

					// Get content between opening and closing tags
					const content = token.raw
						.replace(
							new RegExp(`<${componentName}[^>]*>(.*?)</${componentName}>`, 's'),
							'$1'
						)
						.trim();

					parsed.push({
						id,
						component: components[componentName],
						props: {
							...parseAttributes(attributes),
							content // Pass content as a prop instead of innerHTML
						}
					});
				} else {
					// Regular HTML
					parsed.push({
						id,
						component: 'div',
						props: {
							innerHTML: token.raw,
							attributes: ''
						}
					});
				}
			} else if (token.type === 'heading') {
				const slug = slugify(token.text);
				parsed.push({
					id,
					component: `h${token.depth}`,
					props: {
						innerHTML: token.text,
						id: slug,
						attributes: 'class="heading"'
					}
				});
			} else if (token.type === 'paragraph') {
				parsed.push({
					id,
					component: 'p',
					props: {
						innerHTML: token.text,
						attributes: ''
					}
				});
			} else {
				// Handle other token types
				parsed.push({
					id,
					component: 'div',
					props: {
						innerHTML: token.raw,
						attributes: ''
					}
				});
			}
		}

		structuredMarkdown = parsed;
	}

	// Reactive statement that calls parseMarkdown when `markdown` changes
	$: parseMarkdown(markdown);
</script>

<!-- Render each item in structuredMarkdown separately -->
{#each structuredMarkdown as { id, component, props } (id)}
	{#if component === null}
		{@html props.innerHTML}
	{:else if typeof component === 'string'}
		{@html `<${component} ${props.attributes} id="${props.id || ''}">${props.innerHTML}</${component}>`}
	{:else}
		<svelte:component this={component} {...props} />
	{/if}
{/each}
