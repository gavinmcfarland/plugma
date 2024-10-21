<script>
	import '../app.css';
	import { notifications } from '@/stores';
	import Notification from '@/components/Notification.svelte';
	import Icon from '@/components/Icon.svelte';
</script>

<div class="app">
	<!-- <Header /> -->

	<nav class="p-4 pr-5 flex justify-between items-center border-b sticky top-0 backdrop-blur-lg">
		<div class="flex">
			<a href="/" class="items-center flex gap-3">
				<Icon svg="terminal-filled" size={20} strokeWidth={1.5} />
				<span>Plugma</span>
			</a>
		</div>
		<div class="flex gap-6">
			<a href="/docs" class="hover:underline">Docs</a>
			<a href="https://github.com/yourusername/plugma" class="hover:underline" target="_blank"
				>GitHub</a
			>
		</div>
	</nav>

	<main>
		<slot />
	</main>

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
	* > :global(.Icon) {
		display: inline-flex;
	}
</style>
