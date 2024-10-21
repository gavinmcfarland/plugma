<script>
	import { onMount } from 'svelte'
	import hljs from 'highlight.js'
	import bash from 'highlight.js/lib/languages/bash'
	import Icon from './Icon.svelte'
	import { notify } from '@/stores'

	hljs.registerLanguage('bash', bash)

	export let lang
	export let text
	export let persistCopyButton = false

	$: html_now = hljs.highlight(text, { language: 'bash' }).value

	onMount(() => {
		document.addEventListener('DOMContentLoaded', (event) => {
			hljs.highlightAll()
		})
	})

	// Function to copy text to clipboard
	const copyToClipboard = () => {
		const tempInput = document.createElement('textarea')
		tempInput.value = text
		document.body.appendChild(tempInput)
		tempInput.select()
		document.execCommand('copy')
		document.body.removeChild(tempInput)
		// alert('Text copied to clipboard')
		notify({ type: 'passive', message: 'Text copied to clipboard', timeout: 5000 })
	}
</script>

<div class="Code p-4 pr-16 border mb-12 rounded-md {$$props.class}">
	<pre><code>{@html html_now}</code></pre>
	<button class="copy-button p-2 {persistCopyButton ? 'visible' : 'hidden'}" on:click={copyToClipboard}
		><Icon size={24} svg="copy" /></button
	>
</div>

<!-- Optional CSS for the button -->
<style>
	.Code {
		position: relative;
		overflow: scroll;
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
		background-color: var(--color-bg-hover);
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
</style>
