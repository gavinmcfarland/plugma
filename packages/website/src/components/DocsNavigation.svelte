<script lang="ts">
	import { page } from '$app/state';

	const {
		navItems,
		folders,
		isOpen = false,
		onNavigate
	} = $props<{
		navItems: Array<{ slug: string; title: string }>;
		folders: Array<{ name: string; items: Array<{ slug: string; title: string }> }>;
		isOpen?: boolean;
		onNavigate: () => void;
	}>();

	let slug = $state('');

	$effect(() => {
		const { url } = page;
		// Ensure slug is never undefined by providing a default empty string
		slug = url.pathname.split('/').pop() ?? '';
	});
</script>

<!-- Navigation menu -->
<div class="md:w-60 shrink-0">
	<nav class="md:sticky top-[143px] {isOpen ? 'mobile-menu-open' : 'mobile-menu-closed'}">
		<div class="nav-content">
			<h3 class="mb-2">Guides</h3>
			<ul>
				{#each navItems as { slug: itemSlug, title }}
					<li>
						<a
							href={`/docs/${itemSlug}`}
							onclick={onNavigate}
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
								onclick={onNavigate}
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
</div>

<style>
	* > :first-child {
		margin-top: 0;
	}

	* > :last-child {
		margin-bottom: 0;
	}
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
			z-index: 40;
			overflow-y: auto;
			margin-bottom: 2rem;
			z-index: 100;
			position: fixed;
			top: 0;
			left: 0;
			bottom: 0;
			padding: 24px;
			background-color: var(--color-bg);
		}

		.nav-content {
			height: 100%;
		}
	}
</style>
