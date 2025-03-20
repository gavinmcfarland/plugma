<script>
	import { onMount } from 'svelte';
	import hljs from 'highlight.js';
	import bash from 'highlight.js/lib/languages/bash';
	import js from 'highlight.js/lib/languages/javascript';
	import json from 'highlight.js/lib/languages/json';
	import Icon from './Icon.svelte';
	import { notify } from '@/stores';

	hljs.registerLanguage('bash', bash);
	hljs.registerLanguage('js', js);
	hljs.registerLanguage('json', json);

	export let lang;
	export let text;
	export let persistCopyButton = false;
	let copied = false; // State to track if the text is copied

	$: html_now = hljs.highlight(text, { language: lang }).value;

	onMount(() => {
		document.addEventListener('DOMContentLoaded', (event) => {
			hljs.highlightAll();
		});
	});

	// Function to copy text to clipboard
	const copyToClipboard = () => {
		const tempInput = document.createElement('textarea');
		tempInput.value = text;
		document.body.appendChild(tempInput);
		tempInput.select();
		document.execCommand('copy');
		document.body.removeChild(tempInput);
		// notify({ type: 'passive', message: 'Text copied to clipboard', timeout: 5000 });
		copied = true; // Set copied to true
		setTimeout(() => (copied = false), 5000); // Reset copied state after 5 seconds
	};
</script>

<div class="Code border mt-4 mb-4 rounded-md {$$props.class}">
	<div class="overflow-auto p-4 pr-16">
		<pre><code>{@html html_now}</code></pre>
		<button
			aria-label="Copy code"
			class="copy-button p-2 {persistCopyButton ? 'visible' : 'hidden'}"
			class:copied
			on:click={copyToClipboard}
		>
			{#if copied}
				<Icon size={24} svg="check" isAnimated color="var(--color-success)" />
				<!-- Display tick icon when copied -->
			{:else}
				<Icon size={24} svg="copy" /> <!-- Default copy icon -->
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

	.Code code {
		/* color: var(--color-text-secondary); */
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
