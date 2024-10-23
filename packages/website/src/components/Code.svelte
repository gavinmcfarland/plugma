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
		// alert('Text copied to clipboard')
		notify({ type: 'passive', message: 'Text copied to clipboard', timeout: 5000 });
	};
</script>

<div class="Code border mb-8 rounded-md {$$props.class}">
	<div class="overflow-scroll p-4 pr-16">
		<pre><code>{@html html_now}</code></pre>
		<button
			aria-label="Copy code"
			class="copy-button p-2 {persistCopyButton ? 'visible' : 'hidden'}"
			on:click={copyToClipboard}><Icon size={24} svg="copy" /></button
		>
	</div>
</div>

<!-- Optional CSS for the button -->
<style>
	.Code {
		position: relative;
		background-color: var(--color-bg);
		@apply my-4;
	}

	.Code code {
		/* color: var(--color-text-secondary); */
	}
	.copy-button {
		position: absolute;
		top: 8px;
		right: 8px;
		/* display: none; */
		border: none;
		border-radius: 4px;
		cursor: pointer;
		display: inline-flex;
	}

	/* Show copy button on hover */
	.Code:hover .copy-button {
		opacity: 1;
	}

	.copy-button:hover {
		background-color: var(--color-bg-secondary-hover);
	}

	/* If alwaysShowCopyButton is true, make the button always visible */
	.visible {
		opacity: 1;
	}

	.hidden {
		opacity: 0;
	}

	/* * > :global(.Icon) {
		display: table;
	} */

	.hidden-text {
		display: none;
	}
</style>
