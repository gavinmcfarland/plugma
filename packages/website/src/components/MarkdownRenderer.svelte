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

	const tokenToTagMap = {
		paragraph: 'p',
		list_item: 'li',
		list: 'ul',
		strong: 'strong',
		em: 'em',
		del: 'del',
		blockquote: 'blockquote',
		link: 'a'
	};

	function parseMarkdown(content: string) {
		structuredMarkdown = [];
		uniqueId = 0;

		const tokens = marked.lexer(content);

		for (const token of tokens) {
			const id = uniqueId++;

			switch (token.type) {
				case 'heading': {
					const componentTag = `h${token.depth}`;
					const content = marked.parseInline(token.text);
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

				case 'html': {
					console.log(token);
					const htmlRegex = /^<(\w+)(\s+[^>]*)?>([\s\S]*?)<\/\1>$/;
					const match = token.text.trim().match(htmlRegex);

					if (match) {
						const [, tagName, rawAttributes = '', content] = match;

						// Parse attributes into a key-value object
						const attributes: Record<string, any> = {};
						rawAttributes.replace(
							/(\w+)=["']([^"']*)["']/g,
							(match, attrName, attrValue) => {
								attributes[attrName] = attrValue;
								return match;
							}
						);

						// Convert attributes object to a string format for inline HTML rendering
						const attributesString = Object.entries(attributes)
							.map(([key, value]) => `${key}="${value}"`)
							.join(' ');

						// Push the detected component, attributes as a string, and parsed Markdown content
						structuredMarkdown.push({
							id,
							component: tagName,
							props: {
								attributes: attributesString,
								innerHTML: marked.parseInline(content)
							}
						});
					} else {
						// Fallback to treating as raw HTML if no matching HTML structure
						const parsedContent = marked.parseInline(token.text);
						structuredMarkdown.push({
							id,
							component: null,
							props: { innerHTML: parsedContent }
						});
					}
					break;
				}

				case 'paragraph': {
					const content = marked.parseInline(token.text).trim();
					if (content) {
						structuredMarkdown.push({
							id,
							component: 'p',
							props: { innerHTML: content }
						});
					}
					break;
				}

				case 'space': {
					// Skip 'space' tokens with two or more newlines
					if (!token.raw.includes('\n\n')) {
						structuredMarkdown.push({
							id,
							component: 'br',
							props: {}
						});
					}
					break;
				}

				default: {
					const tag = tokenToTagMap[token.type] || 'div';
					const content = marked.parser([token]);

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
{#each structuredMarkdown as { id, component, props } (id)}
	{#if component === null}
		<!-- {@html props.innerHTML} -->
	{:else if typeof component === 'string'}
		<!-- {console.log(props)} -->
		{@html `<${component} ${props.attributes}>${props.innerHTML}</${component}>`}
	{:else}
		<svelte:component this={component} {...props} />
	{/if}
{/each}
