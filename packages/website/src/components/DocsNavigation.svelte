<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	let {
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

	onMount(() => {
		const unsubscribe = afterNavigate(() => {
			onNavigate();
		});

		return unsubscribe;
	});
</script>

<!-- Navigation menu -->
<div
	class="skrim {isOpen ? 'mobile-menu-open' : 'mobile-menu-closed'}"
	onkeydown={(e) => e.key === 'Escape'}
	onclick={(e) => {
		if (e.target === e.currentTarget) {
			onNavigate();
		}
	}}
	role="dialog"
	tabindex="0"
>
	<div class="md:w-64 shrink-0">
		<nav class="md:sticky top-[143px] menu">
			<div class="nav-content">
				<!-- <ul>
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
				</ul> -->

				{#each folders as folder}
					{#if folder.name !== 'index'}
						<h3 class="mb-2" style="text-transform: capitalize">{folder.name}</h3>
					{/if}
					{#each folder.items as item}
						<ul>
							<li>
								<a
									href={`/docs/${item.slug}`}
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
		.skrim {
			/* backdrop-filter: blur(30px); */
			width: 100%;
			height: 100%;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background-color: rgba(20, 20, 20, 0.9);
			z-index: 100;
		}
		.mobile-menu-closed {
			display: none;
		}

		.mobile-menu-open .menu {
			overflow-y: auto;
			z-index: 100;
			position: fixed;
			top: 0;
			left: 0;
			bottom: 0;
			padding: 24px 16px;
			padding-top: 106px;
			background-color: var(--color-bg);
		}

		.nav-content {
			height: 100%;
		}
	}
</style>
