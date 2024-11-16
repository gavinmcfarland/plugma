<script script lang="ts">
	import { createEventDispatcher } from 'svelte'

	const dispatch = createEventDispatcher()

	function handleClick() {
		dispatch('click') // Dispatch a 'click' event
	}
</script>

<div class="DropdownItem" on:click={handleClick}>
	<slot></slot>
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
