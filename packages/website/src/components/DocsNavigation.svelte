<script lang="ts">
	import { page } from '$app/state';
	import Icon from './Icon.svelte';

	const { navItems, folders } = $props<{
		navItems: Array<{ slug: string; title: string }>;
		folders: Array<{ name: string; items: Array<{ slug: string; title: string }> }>;
	}>();

	let slug = $state('');
	let isMenuOpen = $state(false);

	$effect(() => {
		const { url } = page;
		// Ensure slug is never undefined by providing a default empty string
		slug = url.pathname.split('/').pop() ?? '';
	});

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}
</script>

<!-- Mobile menu button -->
<button
	class="md:hidden z-50 flex items-center gap-2"
	onclick={toggleMenu}
	aria-label="Toggle navigation menu"
>
	{#if isMenuOpen}
		<Icon size={20} svg="close"></Icon>
	{:else}
		<Icon size={20} svg="menu"></Icon> Menu
	{/if}
</button>

<!-- Navigation menu -->
<nav class="md:sticky top-[143px] {isMenuOpen ? 'mobile-menu-open' : 'mobile-menu-closed'}">
	<div class="nav-content">
		<h3 class="mb-2">Guides</h3>
		<ul>
			{#each navItems as { slug: itemSlug, title }}
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

		{#each folders as folder}
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
	</div>
</nav>

<style>
	nav :global(a) {
		line-height: 32px;
	}
	nav :global(a.active) {
		font-weight: 500;
		color: var(--color-text);
	}

	@media (max-width: 768px) {
		.mobile-menu-closed .nav-content {
			display: none;
		}

		.mobile-menu-open {
			/* position: fixed; */
			/* top: 0; */
			/* left: 0; */
			/* right: 0; */
			/* bottom: 0; */
			background: white;
			z-index: 40;
			padding: 4rem 1rem 1rem 1rem;
			overflow-y: auto;
		}

		.nav-content {
			height: 100%;
		}
	}
</style>
