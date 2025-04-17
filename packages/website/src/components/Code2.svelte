<!-- @migration-task Error while migrating Svelte code: $$props is used together with named props in a way that cannot be automatically migrated. -->
<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import { notify } from '@/stores';
	import { highlighter } from '@/lib/stores/shiki';

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
	// Generate ID if not provided in props
	const elementId = props.id ?? generateId();

	let copied = $state(false);
	let html_now = $state('');

	$effect(() => {
		console.log('Effect running:', { text, lang, highlighter: $highlighter });
		if ($highlighter && typeof ($highlighter as any).codeToHtml === 'function') {
			html_now = ($highlighter as any).codeToHtml(text, {
				lang,
				theme: 'github-dark'
			});
		}
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
