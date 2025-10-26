<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import { notify } from '@/stores';
	import { highlighter } from '@/lib/stores/shiki';
	import { transformCommand, type PackageManager } from '@/lib/package-manager-commands';
	import { selectedPackageManager, setPackageManager } from '@/stores/packageManager';

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

	let copied = $state(false);
	let html_now = $state('');

	// Get the current command text based on selected manager
	const currentText = $derived(allPackageManagers[$selectedPackageManager] || originalText);
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

	// Update highlighting when selected manager changes
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

	// Switch package manager - update global state
	const switchManager = (manager: string) => {
		setPackageManager(manager);
	};
</script>

<div class="PackageManagerCode border mt-4 mb-4 rounded-md {class_}">
	<!-- Package manager selector -->
	{#if packageManagerNames.length > 1}
		<div class="package-manager-selector p-3 pb-0 border-color-border bg-color-bg-secondary">
			<div class="flex items-center gap-2 flex-wrap">
				{#each packageManagerNames as manager}
					<button
						class="package-manager-button {$selectedPackageManager === manager
							? 'active'
							: ''}"
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

	.package-manager-button {
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
		border-radius: 0.375rem;
		color: var(--color-text);
		font-weight: 500;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.package-manager-button:hover {
		background-color: var(--color-bg-secondary);
		border-color: var(--color-primary);
	}

	.package-manager-button:active {
		transform: translateY(0);
	}

	/* Active button styling */
	.package-manager-button.active {
		background-color: var(--color-bg-secondary);
		color: var(--color-text);
		font-weight: 600;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		text-decoration: none;
	}
</style>
