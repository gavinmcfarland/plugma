<script lang="ts">
	import { inject } from '@vercel/analytics';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import '../app.css';
	import { notifications } from '@/stores';
	import Notification from '@/components/Notification.svelte';
	import Icon from '@/components/Icon.svelte';
	import Meta from '@/components/Meta.svelte';
	import Banner from '@/components/Banner.svelte';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	inject();
	injectSpeedInsights();

	function getCurrentYear() {
		const currentYear = new Date().getFullYear();
		return currentYear;
	}

	let currentYear = getCurrentYear();
</script>

<svelte:head>
	<Meta image="https://plugma.dev/og.png" siteName="Plugma" />
</svelte:head>

<div class="app">
	<!-- <Header /> -->

	<div class="fixed top-0 z-50 w-full">
		<Banner>
			<p>Previewing the next release of Plugma</p>
		</Banner>

		<div class="navbar py-4 px-6 flex justify-between border-b">
			<nav class="mx-auto flex grow justify-between">
				<div class="flex">
					<a href="/" class="items-center flex gap-3">
						<Icon svg="plug-filled" size={20} strokeWidth={1.5} />
						<span>Plugma</span>
					</a>
				</div>
				<div class="flex gap-6">
					<a href="/docs" class="hover:underline">Docs</a>
					<a
						href="https://github.com/gavinmcfarland/plugma"
						style="display: flex"
						target="_blank"
					>
						<Icon svg="github" size={24} strokeWidth={1.5} /></a
					>
				</div>
			</nav>
		</div>
	</div>

	<main class="grow mt-[98px] max-w-[1200px] mx-auto">
		{@render children?.()}
	</main>

	<footer class="p-4 flex justify-between">
		<p class="m-0 text-sm">Copyright {currentYear} &copy; Plugma</p>
		<p class="m-0 text-sm">
			by <a class="hover:underline" href="https://x.com/gavinmcfarland">@gavinmcfarland</a>
		</p>
	</footer>

	{#each $notifications as notification}
		<Notification
			id={notification.id}
			timeout={notification.timeout}
			type={notification.type}
			message={notification.message}
		></Notification>
	{/each}
</div>

<style>
	.navbar {
		/* background-color: var(--color-bg); */
		background-color: hsl(var(--color-bg-hsl) / 0.8);
		@apply backdrop-blur-lg;
	}
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
</style>
