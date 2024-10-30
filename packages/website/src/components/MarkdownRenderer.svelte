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
					const slug = slugify(token.text);

					if (components[componentTag]) {
						// Only add the anchor link if the heading depth is greater than 1
						structuredMarkdown.push({
							id,
							component: components[componentTag],
							props: {
								level: token.depth,
								content,
								id: slug, // Add id to heading props for linking
								anchorLink: token.depth !== 1 ? `#${slug}` : null // Link for the anchor if depth > 1
							}
						});
					} else {
						// If depth is greater than 1, add anchor link span, else omit it
						const innerHTML =
							token.depth !== 1
								? `<span class="anchor-link"><a href="#${slug}" aria-label="Anchor link"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M13.2505 16.7495L11.0005 18.9995C9.3436 20.6563 6.65731 20.6563 5.00046 18.9995C3.3436 17.3426 3.3436 14.6563 5.00045 12.9995L7.25045 10.7495M16.7505 13.2495L19.0005 10.9995C20.6573 9.34262 20.6573 6.65633 19.0005 4.99947C17.3436 3.34262 14.6573 3.34262 13.0005 4.99948L10.7505 7.24948" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.8" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M9 15L15 9" stroke="currentColor" stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg></a></span> ${content}`
								: content;

						structuredMarkdown.push({
							id,
							component: `h${token.depth}`,
							props: {
								id: slug,
								innerHTML
							}
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
					const htmlRegex = /^<(\w+)(\s+[^>]*)?>([\s\S]*?)<\/\1>$/;
					const match = token.text.trim().match(htmlRegex);

					console.log('---', token.text);

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
		{@html `<${component} ${props.attributes} id=${props.id}>${props.innerHTML}</${component}>`}
	{:else}
		<svelte:component this={component} {...props} />
	{/if}
{/each}
