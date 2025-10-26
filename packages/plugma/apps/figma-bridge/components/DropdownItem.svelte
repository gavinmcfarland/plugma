<script script lang="ts">
	import { createEventDispatcher } from 'svelte'
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	const dispatch = createEventDispatcher()

	function handleClick() {
		dispatch('click') // Dispatch a 'click' event
	}
</script>

<div class="DropdownItem" onclick={handleClick}>
	{@render children?.()}
</div>

<style>
	.DropdownItem {
		line-height: 24px;
		padding-inline: 8px;
	}
	.DropdownItem:hover {
		border-radius: var(--radius-medium);
		background-color: var(--figma-color-bg-brand);
	}
</style>
