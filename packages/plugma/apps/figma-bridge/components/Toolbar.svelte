<script lang="ts">
	import { onMount } from 'svelte'
	import { pluginWindowSettings, isBrowserConnected, isTestRunnerConnected } from '../../shared/stores'
	import Button from './Button.svelte'
	import Icon from './Icon.svelte'
	import Select from './Select.svelte'

	let isWindowMinimized

	if (window.runtimeData.command === 'preview') {
		isWindowMinimized = true
	}

	// const dropdownWindow = window.open('', '', 'width=200,height=300')
	// console.log(dropdownWindow)
	// dropdownWindow.document.write('<html><body>Dropdown content here...</body></html>')

	let selectedFruit = $state('')
	let menuItems = $state([
		{ value: 'MINIMIZE_WINDOW', label: 'Minimize window' },
		// { isDivider: true }, // Divider here
		{ value: 'DELETE_CLIENT_STORAGE', label: 'Delete client storage' },
		{ value: 'DELETE_ROOT_PLUGIN_DATA', label: 'Delete root plugin data' },
		// { isDivider: true }, // Divider here
		{ value: 'HIDE_TOOLBAR', label: 'Hide toolbar' },
	])

	if ($pluginWindowSettings.minimized) {
		menuItems[0] = { value: 'MAXIMIZE_WINDOW', label: 'Maximise window' }
	}

	// This function updates the window action (maximize/minimize) in the menu items
	function updateWindowAction() {
		const maximizeItem = {
			value: 'MAXIMIZE_WINDOW',
			label: 'Maximize window',
		}
		const minimizeItem = {
			value: 'MINIMIZE_WINDOW',
			label: 'Minimize window',
		}

		// Remove any existing window actions first
		menuItems = menuItems.filter((item) => item.value !== 'MAXIMIZE_WINDOW' && item.value !== 'MINIMIZE_WINDOW')

		// Add the correct window action at a fixed position (e.g., index 2)
		const windowAction = isWindowMinimized ? maximizeItem : minimizeItem
		menuItems.splice(0, 0, windowAction) // Insert at index 2
	}

	function handleSelectChange(event) {
		const selectedValue = event.target.value

		// Handle window maximize/minimize logic based on the selected option
		if (selectedValue === 'MAXIMIZE_WINDOW') {
			isWindowMinimized = false
		} else if (selectedValue === 'MINIMIZE_WINDOW') {
			isWindowMinimized = true
		}

		// Update the menu items after the change
		updateWindowAction()
	}

	function openWindow() {
		// Only if inside iframe
		if (window.parent) {
			window.open(`http://localhost:${window.runtimeData.port}`)
		}
	}

	onMount(() => {
		// updateWindowAction()
	})
</script>

<!-- <div class="Toolbar-spacer"></div> -->
<div class="Toolbar">
	<Button on:click={openWindow}>
		{#if $isBrowserConnected && $isTestRunnerConnected}
			<Icon svg="socket-connected-2" />
		{:else if $isBrowserConnected}
			<Icon svg="socket-connected" />
		{:else if $isTestRunnerConnected}
			<Icon svg="socket-connected-3" accentColor="#0D99FF" />
		{:else}
			<Icon svg="socket-disconnected" />
		{/if}
	</Button>

	<!-- <Button
		on:click={(event) => {
			handleWindowSize(event)
		}}
	>
		{#if isWindowMinimized}
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect
					x="5.5"
					y="5.5"
					width="13"
					height="13"
					rx="1"
					stroke="currentColor"
					stroke-opacity="0.3"
					stroke-linecap="round"
				/>
				<rect x="5.5" y="12.5" width="9" height="6" rx="1" stroke="currentColor" />
			</svg>
		{:else}
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect
					x="5.5"
					y="12.5"
					width="9"
					height="6"
					rx="1"
					stroke="currentColor"
					stroke-opacity="0.3"
					stroke-linecap="round"
				/>
				<rect x="5.5" y="5.5" width="13" height="13" rx="1" stroke="currentColor" stroke-linecap="round" />
			</svg>
		{/if}
	</Button> -->

	<div class="spacer"></div>

	<div class="group">
		<Select
			label="Choose an option"
			options={menuItems}
			bind:selected={selectedFruit}
			on:change={handleSelectChange}
		/>

		<!-- <Dropdown>

			<svelte:fragment slot="trigger" let:isOpen>

				<Button active={isOpen}>
					<Icon svg="horizontal-ellipsis" />
				</Button>
			</svelte:fragment>
			<div slot="content">
				{#if isWindowMinimized}
					<DropdownItem
						on:click={(event) => {
							handleWindowSize(event)
						}}>Maximise plugin</DropdownItem
					>
				{:else}
					<DropdownItem
						on:click={(event) => {
							handleWindowSize(event)
						}}>Minimise plugin</DropdownItem
					>
				{/if}

				<DropdownDivider />

				<DropdownItem>Delete client storage</DropdownItem>
				<DropdownItem>Delete plugin data</DropdownItem>

				<DropdownDivider />

				<DropdownItem>Hide toolbar</DropdownItem>
			</div>
		</Dropdown> -->
	</div>
</div>

<style>
	/* .Toolbar-spacer {
		padding-bottom: 1px;
		margin-bottom: 40px;
	} */

	.Toolbar {
		background-color: var(--figma-color-bg-brand-tertiary);
		/* background-color: var(--figma-color-bg); */
		/* position: fixed; */
		display: flex;
		/* top: 0;
		left: 0;
		right: 0; */
		/* bottom: 0; */
		z-index: 9999;
		padding: 8px;
		border-bottom: 1px solid var(--figma-color-border);
	}

	/* svg {
		flex-grow: 0;
	} */

	.spacer {
		flex-grow: 1;
	}

	.group {
		display: flex;
		gap: 4px;
	}
</style>
