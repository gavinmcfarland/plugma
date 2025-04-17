<script lang="ts">
	import { page } from '$app/state'; // To get the current page URL and slug
	import Folder from '@/components/Folder.svelte';
	import Icon from '@/components/Icon.svelte';
	import { onMount } from 'svelte';
	let { data, children } = $props();

	let slug = $state('');
	let currentIndex = -1;
	let prevItem: { slug: string; title: string } | null = $state(null);
	let nextItem: { slug: string; title: string } | null = $state(null);

	// In Svelte 5, you can use $effect instead of subscribe
	$effect(() => {
		const { url } = page;
		slug = url.pathname.split('/').pop();
		currentIndex = data.navItems.findIndex((item) => item.slug === slug);

		if (currentIndex !== -1) {
			prevItem = currentIndex > 0 ? data.navItems[currentIndex - 1] : null;
			nextItem =
				currentIndex < data.navItems.length - 1 ? data.navItems[currentIndex + 1] : null;
		}
	});
</script>

<div>
	<div class="border-t-0 mt-12 mb-16 px-4">
		<div class="max-w-4xl mx-auto md:flex gap-6">
			<div class="w-60 mb-12 shrink-0">
				<nav class="md:sticky top-[143px]">
					<h3 class="mb-2">Guides</h3>
					<ul>
						{#each data.navItems as { slug: itemSlug, title }}
							<li>
								<a
									href={`/docs/${itemSlug}`}
									class="hover:underline {slug === itemSlug ? 'active' : ''}"
								>
									{title}
								</a>
							</li>
						{/each}
					</ul>

					{#each data.folders as folder}
						<h3 class="mb-2" style="text-transform: capitalize">{folder.name}</h3>
						{#each folder.items as item}
							<ul>
								<li>
									<a
										href={`/docs/${folder.name}/${item.slug}`}
										class="hover:underline {slug === item.slug ? 'active' : ''}"
									>
										{item.title}
									</a>
								</li>
							</ul>
						{/each}
					{/each}
				</nav>
			</div>

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

<style>
	nav a {
		line-height: 32px;
	}
	nav a.active {
		font-weight: 500;
		color: var(--color-text);
	}
</style>
