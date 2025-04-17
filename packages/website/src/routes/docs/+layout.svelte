<script lang="ts">
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

	$effect(() => {
		const { url } = page;
		const slug = url.pathname.split('/').pop() ?? '';
		currentIndex = data.navItems.findIndex((item) => item.slug === slug);

		if (currentIndex !== -1) {
			prevItem = currentIndex > 0 ? data.navItems[currentIndex - 1] : null;
			nextItem =
				currentIndex < data.navItems.length - 1 ? data.navItems[currentIndex + 1] : null;
		}
	});

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}
</script>

<div class="docs-layout">
	<div class="md:hidden flex justify-between items-center px-4 py-3 border-b">
		<DocsMobileMenuButton onToggle={toggleMenu} isOpen={isMenuOpen} />
	</div>
	<div>
		<div class="border-t-0 mt-8 md:mt-12 mb-16 px-4">
			<div class="max-w-4xl mx-auto md:flex gap-6">
				<DocsNavigation
					navItems={data.navItems}
					folders={data.folders}
					isOpen={isMenuOpen}
				/>

				<div class="grow shrink main-content min-w-0">
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
