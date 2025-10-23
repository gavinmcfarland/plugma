<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import { notify } from '@/stores';
	import { highlighter } from '@/lib/stores/shiki';
	import { transformCommand, type PackageManager } from '@plugma/shared';

	const props = $props<{
		text: string;
		lang?: string;
		persistCopyButton?: boolean;
		class_?: string;
		id?: string;
		packageManagers?: Record<string, string>;
	}>();

	const {
		persistCopyButton = false,
		class_ = '',
		id,
		packageManagers = {},
		text: originalText
	} = props;

	// Define package manager commands mapping using shared transformCommand function
	const defaultPackageManagers = {
		npm: originalText,
		yarn: transformCommand(originalText, 'yarn' as PackageManager),
		pnpm: transformCommand(originalText, 'pnpm' as PackageManager),
		bun: transformCommand(originalText, 'bun' as PackageManager)
	};

	// Merge with provided package managers
	const allPackageManagers = { ...defaultPackageManagers, ...packageManagers };
	const packageManagerNames = Object.keys(allPackageManagers);

	let selectedManager = $state('npm');
	let copied = $state(false);
	let html_now = $state('');

	// Get the current command text based on selected manager
	const currentText = $derived(allPackageManagers[selectedManager] || originalText);
	const lang = $derived(props.lang || 'bash');

	const updateHighlighting = () => {
		if ($highlighter && typeof ($highlighter as any).codeToHtml === 'function') {
			html_now = ($highlighter as any).codeToHtml(currentText, {
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
			await navigator.clipboard.writeText(currentText);
			copied = true;
			setTimeout(() => (copied = false), 5000);
		} catch (err) {
			notify({ type: 'error', message: 'Failed to copy to clipboard' });
		}
	};

	// Switch package manager
	const switchManager = (manager: string) => {
		selectedManager = manager;
	};
</script>

<div class="PackageManagerCode border mt-4 mb-4 rounded-md {class_}">
	<!-- Package manager selector -->
	{#if packageManagerNames.length > 1}
		<div class="package-manager-selector p-3 border-color-border bg-color-bg-secondary">
			<div class="flex items-center gap-2 flex-wrap">
				{#each packageManagerNames as manager}
					<button
						class="px-3 py-1 text-sm rounded-md transition-colors {selectedManager ===
						manager
							? 'bg-color-primary text-white'
							: 'bg-color-bg text-color-text hover:bg-color-bg-secondary'}"
						onclick={() => switchManager(manager)}
					>
						{manager}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Code content -->
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
	.PackageManagerCode {
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

	.PackageManagerCode:hover .copy-button {
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

	.package-manager-selector button {
		border: 1px solid var(--color-border);
	}

	.package-manager-selector button:hover {
		border-color: var(--color-primary);
	}
</style>
