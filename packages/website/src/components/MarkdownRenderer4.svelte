<script lang="ts">
	import {
		createHighlighter,
		type Highlighter,
		type BundledLanguage,
		type SpecialLanguage
	} from 'shiki';
	import { onMount } from 'svelte';
	import MarkdownIt from 'markdown-it';

	export let content: string;
	export let components: Record<string, any> = {};

	let parsedContent: string = '';
	let highlighter: Highlighter;
	let isHighlighterReady = false;

	const md = new MarkdownIt({
		html: true,
		highlight: function (str: string, lang: string | undefined) {
			// Simple fallback highlighting while Shiki loads
			if (!isHighlighterReady) {
				return `<pre class="shiki"><code>${str}</code></pre>`;
			}

			try {
				const tokens = highlighter.codeToTokens(str, {
					lang: lang as BundledLanguage | SpecialLanguage,
					theme: 'github-dark'
				});
				let html = '<pre class="shiki">';
				for (const line of tokens.tokens) {
					html += '<span class="line">';
					for (const token of line) {
						const scopeName = token.explanation?.[0]?.scopes[0]?.scopeName;
						const component = scopeName ? components[scopeName] : undefined;
						if (component) {
							html += `<span class="token ${scopeName}" data-component="${component.__name}">${token.content}</span>`;
						} else {
							html += `<span style="color: ${token.color}">${token.content}</span>`;
						}
					}
					html += '</span>\n';
				}
				html += '</pre>';
				return html;
			} catch (e) {
				console.error('Error highlighting code:', e);
				return `<pre class="shiki"><code>${str}</code></pre>`;
			}
		}
	});

	// Process the markdown content
	function processContent() {
		parsedContent = md.render(content);
	}

	// Watch for content changes
	$: if (content) {
		processContent();
	}

	// Initialize shiki highlighter in the background
	onMount(async () => {
		// Render content immediately with basic formatting
		processContent();

		highlighter = await createHighlighter({
			themes: ['github-dark'],
			langs: [
				'javascript',
				'typescript',
				'svelte',
				'json',
				'markdown',
				'bash',
				'shell',
				'jsonc',
				'html'
			]
		});

		// Mark highlighter as ready and re-render content
		isHighlighterReady = true;
		processContent();
	});
</script>

{#if parsedContent}
	{@html parsedContent}
{/if}

<style>
	:global(.shiki) {
		background-color: #24292e;
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
	}

	:global(.shiki .line) {
		line-height: 1.5;
	}

	:global(.token) {
		font-family: 'Fira Code', monospace;
	}
</style>
