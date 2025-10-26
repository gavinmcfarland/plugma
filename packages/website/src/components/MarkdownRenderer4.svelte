<script lang="ts">
	import { run } from 'svelte/legacy';

	import {
		createHighlighter,
		type Highlighter,
		type BundledLanguage,
		type SpecialLanguage
	} from 'shiki';
	import { onMount } from 'svelte';
	import MarkdownIt from 'markdown-it';
	import markdownItAttrs from 'markdown-it-attrs';

	interface Props {
		content: string;
		components?: Record<string, any>;
	}

	let { content, components = {} }: Props = $props();

	let parsedContent: string = $state('');

	// Pre-process content to handle markdown inside HTML blocks
	function preprocessContent(content: string) {
		// First, preserve code blocks
		const codeBlocks: string[] = [];
		content = content.replace(/```([\s\S]*?)```/g, (match, code) => {
			codeBlocks.push(code);
			return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
		});

		// Process markdown inside any HTML tags
		// content = content.replace(
		// 	/<([a-zA-Z0-9]+)(\s+[^>]*)?>([\s\S]*?)<\/\1>/g,
		// 	(match, tag, attributes, inner) => {
		// 		// Skip if the tag is a code block or pre (these should be handled by shiki)
		// 		if (tag === 'code' || tag === 'pre') return match;

		// 		// Process the inner content with markdown
		// 		const processedInner = md.render(inner.trim());
		// 		return `<${tag}${attributes || ''}>${processedInner}</${tag}>`;
		// 	}
		// );

		// Restore code blocks
		content = content.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
			return `\`\`\`${codeBlocks[parseInt(index)]}\`\`\``;
		});

		return content;
	}

	// Initialize markdown-it outside of component lifecycle
	const md = new MarkdownIt({
		html: true,
		breaks: true,
		block: true,
		inline: true
	}).use(markdownItAttrs);

	// Add a function to process components in the rendered content
	function processComponents(html: string) {
		// Replace component placeholders with actual components
		return html.replace(
			/<([a-zA-Z0-9]+)(\s+[^>]*)?>([\s\S]*?)<\/\1>/g,
			(match, tag, attributes, inner) => {
				// Check if we have a component for this tag
				if (components[tag]) {
					// Create a unique ID for the component
					const id = `component-${Math.random().toString(36).substr(2, 9)}`;

					// Store the component data
					componentData[id] = {
						component: components[tag],
						props: parseAttributes(attributes),
						content: inner
					};

					// Return a placeholder that will be replaced by the component
					return `<div id="${id}"></div>`;
				}
				return match;
			}
		);
	}

	// Helper function to parse HTML attributes into an object
	function parseAttributes(attrString: string) {
		if (!attrString) return {};
		const attrs = {};
		attrString.match(/\w+="[^"]*"/g)?.forEach((attr) => {
			const [name, value] = attr.split('=');
			attrs[name] = value.replace(/"/g, '');
		});
		return attrs;
	}

	// Store component data
	let componentData: Record<string, any> = $state({});

	// Update the processContent function
	function processContent(content: string) {
		const preprocessedContent = preprocessContent(content);
		const renderedContent = md.render(preprocessedContent);
		return processComponents(renderedContent);
	}

	// Initialize parsedContent with processed content immediately
	run(() => {
		parsedContent = content ? md.render(processContent(content)) : '';
	});
</script>

{#if parsedContent}
	{@html parsedContent}
{/if}

{#each Object.entries(componentData) as [id, data]}
	<data.component {...data.props}>
		{@html data.content}
	</data.component>
{/each}

<style>
	/* :global(.shiki) {
		background-color: #24292e;
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
	} */

	/* :global(.shiki .line) {
		line-height: 1.5;
	} */

	/* :global(.token) {
		font-family: 'Fira Code', monospace;
	} */
</style>
