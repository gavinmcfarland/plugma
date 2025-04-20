<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Folder from '@/components/Folder.svelte';
	import Icon from '@/components/Icon.svelte';
	import DocsNavigation from '@/components/DocsNavigation.svelte';
	import DocsMobileMenuButton from '@/components/DocsMobileMenuButton.svelte';

	let { data, children } = $props();

	let currentIndex = -1;
	let prevItem: { slug: string; title: string } | null = $state(null);
	let nextItem: { slug: string; title: string } | null = $state(null);
	let isMenuOpen = $state(false);

	let navContainer: HTMLDivElement;

	$effect(() => {
		const { url } = page;
		const fullSlug = url.pathname.replace('/docs/', '');

		// Flatten all items from all folders into a single array
		const allItems = data.folders.reduce((acc, folder) => {
			return acc.concat(
				folder.items.map((item) => ({
					...item,
					folderName: folder.name
				}))
			);
		}, []);

		// Find the current item index in the flattened array
		const currentIndex = allItems.findIndex((item) => {
			// For index folder items, compare just the slug
			if (item.folderName === 'index') {
				return item.slug === fullSlug;
			}
			// For other folders, compare the full path (folder/slug)
			return `${item.folderName}/${item.slug.split('/').pop()}` === fullSlug;
		});

		if (currentIndex !== -1) {
			prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : null;
			nextItem = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;
		} else {
			prevItem = null;
			nextItem = null;
		}
	});

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	// Function to close the menu if the click is outside
	function handleClickOutside(event: MouseEvent) {
		// toggleMenu();
	}

	// Add event listener when the component is mounted
	onMount(() => {
		document.addEventListener('click', handleClickOutside);

		return () => {
			// Clean up the event listener when the component is destroyed
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="docs-layout">
	<div class="md:hidden flex justify-between items-center px-4 py-3 border-b">
		<div data-mobile-menu>
			<DocsMobileMenuButton onToggle={toggleMenu} isOpen={isMenuOpen} />
		</div>
	</div>
	<div
		bind:this={navContainer}
		onclick={handleClickOutside}
		onkeydown={(e) => e.key === 'Escape' && (isMenuOpen = false)}
		role="dialog"
		tabindex="0"
	>
		<div class="border-t-0 mt-8 md:mt-12 mb-16 px-4">
			<div class="max-w-6xl mx-auto md:flex gap-6">
				<DocsNavigation
					navItems={data.navItems}
					folders={data.folders}
					isOpen={isMenuOpen}
					onNavigate={() => (isMenuOpen = false)}
				/>

				<div class="shrink main-content min-w-0">
					{@render children?.()}

					<!-- Add next and previous navigation links -->
					<div class="mt-8 flex justify-between">
						<div>
							{#if prevItem}
								<a
									href={`/docs/${prevItem.slug}`}
									class="hover:underline flex items-center gap-2"
									><Icon svg="arrow-left" strokeWidth={2} />{prevItem.title}</a
								>
							{/if}
						</div>

						<div>
							{#if nextItem}
								<a
									href={`/docs/${nextItem.slug}`}
									class="hover:underline flex items-center gap-2"
									>{nextItem.title}<Icon svg="arrow-right" strokeWidth={2} /></a
								>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	nav a {
		line-height: 32px;
	}
	nav a.active {
		font-weight: 500;
		color: var(--color-text);
	}
</style>
