<script>
	import { inject } from '@vercel/analytics';
	import '../app.css';
	import { notifications } from '@/stores';
	import Notification from '@/components/Notification.svelte';
	import Icon from '@/components/Icon.svelte';

	function getCurrentYear() {
		const currentYear = new Date().getFullYear();
		return currentYear;
	}

	let currentYear = getCurrentYear();
</script>

<div class="app">
	<!-- <Header /> -->

	<div class="p-4 pr-5 flex justify-between border-b sticky top-0 backdrop-blur-lg z-50">
		<nav class="max-w-7xl mx-auto flex grow justify-between">
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
					class="hover:underline"
					target="_blank">GitHub</a
				>
			</div>
		</nav>
	</div>

	<main class="grow">
		<slot />
	</main>

	<footer class="p-4 flex justify-between">
		<p class="m-0 text-sm">Copyright {currentYear} &copy; Plugma</p>
		<p class="m-0 text-sm hover:underline">
			by <a href="https://x.com/gavinmcfarland">@gavinmcfarland</a>
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
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
</style>
