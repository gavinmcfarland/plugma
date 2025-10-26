<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	interface Props {
		trigger?: import('svelte').Snippet<[any]>;
		content?: import('svelte').Snippet;
	}

	let { trigger, content }: Props = $props();

	let isOpen = $state(false)
	let dropdownMenu = $state()
	let triggerElement = $state()
	let position = $state({ top: false, left: false, right: false, bottom: false })

	function toggleDropdown() {
		isOpen = !isOpen
		if (isOpen) {
			adjustPosition()
		}
	}

	function adjustPosition() {
		const rect = dropdownMenu.getBoundingClientRect()
		const { innerWidth, innerHeight } = window

		position = {
			top: rect.top < 0,
			left: rect.left < 0,
			right: rect.right > innerWidth,
			bottom: rect.bottom > innerHeight,
		}

		dropdownMenu.style.top = position.bottom ? 'auto' : ''
		dropdownMenu.style.bottom = position.bottom ? '100%' : ''
		dropdownMenu.style.left = position.right ? 'auto' : ''
		dropdownMenu.style.right = position.right ? '0' : ''
	}

	// Function to handle closing the dropdown when clicking outside
	function handleClickOutside(event) {
		// Check if the click is not inside the dropdownMenu or on the trigger element
		if (
			dropdownMenu &&
			!dropdownMenu.contains(event.target) &&
			triggerElement &&
			!triggerElement.contains(event.target)
		) {
			isOpen = false
		}
	}

	// Set up listeners
	onMount(() => {
		window.addEventListener('resize', adjustPosition)
		window.addEventListener('click', handleClickOutside) // Add listener for clicks outside the dropdown
	})

	// Cleanup listeners
	onDestroy(() => {
		window.removeEventListener('resize', adjustPosition)
		window.removeEventListener('click', handleClickOutside) // Remove listener for clicks outside the dropdown
	})
</script>

<div class="dropdown" class:open={isOpen}>
	<!-- Bind this to triggerElement to avoid closing when clicking the trigger -->
	<div bind:this={triggerElement} onclick={toggleDropdown}>
		{@render trigger?.({ isOpen, })}
	</div>

	<div
		bind:this={dropdownMenu}
		class="dropdown-menu {position.bottom ? 'top' : 'bottom'} {position.right ? 'left' : 'right'}"
	>
		{@render content?.()}
	</div>
</div>

<style>
	.dropdown {
		position: relative;
		display: inline-block;
	}

	.dropdown-menu {
		position: absolute;
		top: 5px;
		min-width: 150px;
		z-index: 1000;
		display: none;
		transition: opacity 0.3s;
		border-radius: var(--radius-large);
		box-shadow: var(--elevation-400-menu-panel);
		background-color: var(--color-bg-menu);
		padding: 8px;
		color: white;
		margin-top: 5px;
	}

	.dropdown.open .dropdown-menu {
		display: block;
	}

	.dropdown-menu.bottom {
		top: 100%;
	}

	.dropdown-menu.top {
		bottom: 100%;
	}

	.dropdown-menu.right {
		right: 0;
	}

	.dropdown-menu.left {
		left: 0;
	}
</style>
