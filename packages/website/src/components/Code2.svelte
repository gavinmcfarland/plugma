<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import { notify } from '@/stores';
	import { highlighter } from '@/lib/stores/shiki';

	export let lang;
	export let text;
	export let persistCopyButton = false;
	let copied = false;
	let html_now = '';

	// Update HTML whenever the highlighter or text changes
	$: if ($highlighter) {
		html_now = ($highlighter as any).codeToHtml(text, {
			lang,
			theme: 'github-dark'
		});
	}

	// Function to copy text to clipboard
	const copyToClipboard = () => {
		const tempInput = document.createElement('textarea');
		tempInput.value = text;
		document.body.appendChild(tempInput);
		tempInput.select();
		document.execCommand('copy');
		document.body.removeChild(tempInput);
		copied = true;
		setTimeout(() => (copied = false), 5000);
	};
</script>

<div class="Code border mt-4 mb-4 rounded-md {$$props.class}">
	<div class="overflow-auto p-4 pr-16">
		{@html html_now}
		<button
			aria-label="Copy code"
			class="copy-button p-2 {persistCopyButton ? 'visible' : 'hidden'}"
			class:copied
			on:click={copyToClipboard}
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
