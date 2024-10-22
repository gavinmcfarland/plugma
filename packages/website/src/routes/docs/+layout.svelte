<script lang="ts">
	import { page } from '$app/stores'; // To get the current page URL and slug
	import { onMount } from 'svelte';
	export let data;

	let slug = '';
	let currentIndex = -1;
	let prevItem = null;
	let nextItem = null;

	// Get the slug from the current page's path when the page changes
	page.subscribe(({ url }) => {
		slug = url.pathname.split('/').pop(); // Get the last part of the URL path
		currentIndex = data.navItems.findIndex((item) => item.slug === slug);

		// Get the previous and next items based on the current index
		if (currentIndex !== -1) {
			prevItem = currentIndex > 0 ? data.navItems[currentIndex - 1] : null;
			nextItem =
				currentIndex < data.navItems.length - 1 ? data.navItems[currentIndex + 1] : null;
		}
	});
</script>

<div>
	<div class="border-t-0 mt-12 mb-16 px-4">
		<div class="max-w-4xl mx-auto md:flex">
			<div class="w-64 mb-6 shrink-0">
				<nav class="md:sticky top-28">
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
				</nav>
			</div>

			<div class="grow overflow-hidden">
				<slot />

				<!-- Add next and previous navigation links -->
				<div class="mt-8 flex justify-between">
					<div>
						{#if prevItem}
							<a href={`/docs/${prevItem.slug}`} class="hover:underline"
								>← {prevItem.title}</a
							>
						{/if}
					</div>

					<div>
						{#if nextItem}
							<a href={`/docs/${nextItem.slug}`} class="hover:underline"
								>{nextItem.title} →</a
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
