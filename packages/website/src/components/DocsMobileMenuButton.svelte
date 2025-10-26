<script lang="ts">
	import Icon from './Icon.svelte';

	const { onToggle, isOpen } = $props<{
		onToggle: () => void;
		isOpen: boolean;
	}>();
</script>

<button
	class="md:hidden z-50 flex items-center gap-2 text-sm opacity-60 hover:opacity-100 p-4 -m-4"
	onclick={() => onToggle()}
	aria-label="Toggle navigation menu"
>
	{#if isOpen}
		<Icon size={18} svg="close"></Icon>
	{:else}
		<Icon size={18} svg="menu"></Icon> Menu
	{/if}
</button>
