<!-- @migration-task Error while migrating Svelte code: $$props is used together with named props in a way that cannot be automatically migrated. -->
<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import { notify } from '@/stores';
	import { highlighter } from '@/lib/stores/shiki';
	// import { createHighlighterCoreSync } from 'shiki/core';
	// import js from '@shikijs/langs/javascript';
	// import bash from '@shikijs/langs/bash';
	// import css from '@shikijs/langs/css';
	// import jsonc from '@shikijs/langs/jsonc';
	// import html from '@shikijs/langs/html';
	// import ts from '@shikijs/langs/typescript';
	// import md from '@shikijs/langs/markdown';
	// import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

	// // Using syncronous version to avoid loading/delay
	// const highlighter = createHighlighterCoreSync({
	// 	engine: createJavaScriptRegexEngine(),
	// 	themes: [
	// 		{
	// 			name: 'github-dark',
	// 			bg: 'transparent',
	// 			fg: 'var(--code-punctuation)',
	// 			settings: [
	// 				{
	// 					scope: ['*'],
	// 					settings: {
	// 						foreground: '#fff'
	// 					}
	// 				},
	// 				{
	// 					scope: ['keyword', 'keyword.control', 'storage.type', 'storage.modifier'],
	// 					settings: {
	// 						foreground: 'var(--code-keyword)'
	// 					}
	// 				},
	// 				{
	// 					scope: ['string', 'string.quoted', 'string.template'],
	// 					settings: {
	// 						foreground: 'var(--code-string)'
	// 					}
	// 				},
	// 				{
	// 					scope: ['constant.numeric', 'constant.language', 'constant.character'],
	// 					settings: {
	// 						foreground: 'var(--code-number)'
	// 					}
	// 				},
	// 				{
	// 					scope: ['comment', 'comment.line', 'comment.block'],
	// 					settings: {
	// 						foreground: 'var(--code-comment)',
	// 						fontStyle: 'italic'
	// 					}
	// 				},
	// 				{
	// 					scope: ['entity.name.function', 'support.function'],
	// 					settings: {
	// 						foreground: 'var(--code-function)'
	// 					}
	// 				},
	// 				{
	// 					scope: [
	// 						'variable',
	// 						'variable.other',
	// 						'variable.parameter',
	// 						'support.variable'
	// 					],
	// 					settings: {
	// 						foreground: 'var(--code-variable)'
	// 					}
	// 				},
	// 				{
	// 					scope: ['operator', 'keyword.operator'],
	// 					settings: {
	// 						foreground: 'var(--code-operator)'
	// 					}
	// 				},
	// 				{
	// 					scope: ['punctuation'],
	// 					settings: {
	// 						foreground: 'var(--code-punctuation)'
	// 					}
	// 				},
	// 				{
	// 					scope: [
	// 						'entity.name.type',
	// 						'support.type',
	// 						'support.class',
	// 						'support.type.property-name',
	// 						'variable',
	// 						'meta.definition.variable.name',
	// 						'support.variable',
	// 						'entity.name.variable',
	// 						'constant.other.placeholder'
	// 					],
	// 					settings: {
	// 						foreground: 'var(--code-type)'
	// 					}
	// 				},
	// 				{
	// 					scope: [
	// 						'meta.tag',
	// 						'entity.name.tag',
	// 						'support.class',
	// 						'support.type',
	// 						'entity.name.type',
	// 						'entity.name.namespace',
	// 						'entity.other.attribute',
	// 						'entity.name.scope-resolution',
	// 						'entity.name.class',
	// 						'storage.type.numeric.go',
	// 						'storage.type.byte.go',
	// 						'storage.type.boolean.go',
	// 						'storage.type.string.go',
	// 						'storage.type.uintptr.go',
	// 						'storage.type.error.go',
	// 						'storage.type.rune.go',
	// 						'storage.type.cs',
	// 						'storage.type.generic.cs',
	// 						'storage.type.modifier.cs',
	// 						'storage.type.variable.cs',
	// 						'storage.type.annotation.java',
	// 						'storage.type.generic.java',
	// 						'storage.type.java',
	// 						'storage.type.object.array.java',
	// 						'storage.type.primitive.array.java',
	// 						'storage.type.primitive.java',
	// 						'storage.type.token.java',
	// 						'storage.type.groovy',
	// 						'storage.type.annotation.groovy',
	// 						'storage.type.parameters.groovy',
	// 						'storage.type.generic.groovy',
	// 						'storage.type.object.array.groovy',
	// 						'storage.type.primitive.array.groovy',
	// 						'storage.type.primitive.groovy'
	// 					],
	// 					settings: {
	// 						foreground: 'var(--code-tag)'
	// 					}
	// 				}
	// 			]
	// 		}
	// 	],
	// 	langs: [js, bash, css, jsonc, html, ts, md]
	// });

	// Add counter for generating unique IDs
	let idCounter = 0;
	const generateId = () => `code-block-${++idCounter}`;

	const props = $props<{
		lang: string;
		text: string;
		persistCopyButton?: boolean;
		class_?: string;
		id?: string;
	}>();

	const { persistCopyButton = false, class_ = '', id } = props;
	// Get text reactively using $derived
	const text = $derived(props.text);
	const lang = $derived(props.lang);

	let copied = $state(false);
	let html_now = $state('');

	const updateHighlighting = () => {
		if ($highlighter && typeof ($highlighter as any).codeToHtml === 'function') {
			html_now = ($highlighter as any).codeToHtml(text, {
				lang,
				theme: 'github-dark'
			});
		}
	};

	// Initial call
	updateHighlighting();

	$effect(() => {
		updateHighlighting();
	});

	// Function to copy text to clipboard
	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 5000);
		} catch (err) {
			notify({ type: 'error', message: 'Failed to copy to clipboard' });
		}
	};
</script>

<div class="Code border mt-4 mb-4 rounded-md {class_}">
	<div class="overflow-auto p-4 pr-16">
		{@html html_now}
		<button
			aria-label="Copy code"
			class="copy-button p-2 {persistCopyButton ? 'visible' : 'hidden'}"
			class:copied
			onclick={copyToClipboard}
		>
			{#if copied}
				<Icon size={24} svg="check" isAnimated color="var(--color-success)" />
			{:else}
				<Icon size={24} svg="copy" />
			{/if}
		</button>
	</div>
</div>

<style>
	.Code {
		position: relative;
		background-color: var(--color-bg);
		border-color: var(--color-border);
	}

	.copy-button {
		position: absolute;
		top: 8px;
		right: 8px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		display: inline-flex;
	}

	.Code:hover .copy-button {
		opacity: 1;
	}

	.copy-button:hover {
		background-color: var(--color-bg-secondary-hover);
	}

	.hidden {
		opacity: 0;
	}

	.visible,
	.copied {
		opacity: 1;
	}
</style>
