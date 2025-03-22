<script>
	import {
		isDeveloperToolsActive,
		pluginWindowSettings,
	} from "../../shared/stores";
	import Icon from "./Icon.svelte";

	// export let label = "Choose an option"; // Default label
	export let options = []; // Array of options passed into the component
	export let selected = ""; // Bound value for selected option

	// Event handlers
	function handleChange(event) {
		selected = event.target.value;

		if (selected === "MINIMIZE_WINDOW") {
			console.log("MINIMIZE_WINDOW");
			parent.postMessage(
				{
					pluginMessage: {
						event: "PLUGMA_MINIMIZE_WINDOW",
						toolbarHeight: 40,
					},
					pluginId: "*",
				},
				"*",
			);
			pluginWindowSettings.set({
				...$pluginWindowSettings,
				minimized: true,
			});
		}

		if (selected === "MAXIMIZE_WINDOW") {
			console.log("MAXIMIZE_WINDOW");
			parent.postMessage(
				{
					pluginMessage: {
						event: "PLUGMA_MAXIMIZE_WINDOW",
						toolbarHeight: 40,
					},
					pluginId: "*",
				},
				"*",
			);
			pluginWindowSettings.set({
				...$pluginWindowSettings,
				minimized: false,
			});
		}

		if (selected === "DELETE_CLIENT_STORAGE") {
			parent.postMessage(
				{
					pluginMessage: { event: "PLUGMA_DELETE_CLIENT_STORAGE" },
					pluginId: "*",
				},
				"*",
			);
			// Reset back to default
			selected = "select-an-option";
		}

		if (selected === "DELETE_ROOT_PLUGIN_DATA") {
			parent.postMessage(
				{
					pluginMessage: { event: "PLUGMA_DELETE_ROOT_PLUGIN_DATA" },
					pluginId: "*",
				},
				"*",
			);
			// Reset back to default
			selected = "select-an-option";
		}

		if (selected === "HIDE_TOOLBAR") {
			parent.postMessage(
				{
					pluginMessage: { event: "PLUGMA_HIDE_TOOLBAR" },
					pluginId: "*",
				},
				"*",
			);
			pluginWindowSettings.set({
				...$pluginWindowSettings,
				toolbarEnabled: false,
			});
			isDeveloperToolsActive.set(false);
			// Reset back to default
			selected = "select-an-option";
		}
	}

	function handleFocus() {
		console.log("Dropdown is focused (clicked)");
	}

	function handleBlur() {
		console.log("Dropdown lost focus");
	}
</script>

<div class="Select">
	<select
		class="Select"
		bind:value={selected}
		on:change={handleChange}
		on:change
	>
		<option value="select-an-option" disabled selected
			>Select an option</option
		>
		{#each options as option (option.value)}
			{#if option.isDivider}
				<option disabled>────────</option> <!-- Divider style -->
			{:else}
				<option value={option.value}>{option.label}</option>
			{/if}
		{/each}
	</select>
	<div class="select-icon">
		<Icon svg="horizontal-ellipsis" />
	</div>
</div>

<style>
	select {
		padding: 10px;
		margin: 20px;
		font-size: 12px;
	}

	.Select select {
		/* Basic button-like styles */
		appearance: none;
		-webkit-appearance: none; /* For Safari */
		-moz-appearance: none; /* For Firefox */
		padding: 11px;
		font-family: Arial, sans-serif;
		background-color: transparent;
		border-radius: 5px;
		color: #333;
		/* cursor: pointer; */
		width: 24px;
		height: 24px;
		margin: 0;
		border: none;
	}

	/* Custom arrow for the select */
	.Select {
		position: relative;
		display: inline-block;
	}

	/* Focus state */
	.Select select:focus {
		border-color: #2a7d2d;
		outline: none;
	}

	.select-icon {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
	}

	.Select::after {
		display: block;
		content: "";
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1;
		border-radius: 4px;
		pointer-events: none;
	}

	.Select:hover::after {
		background-color: var(--figma-color-bg-inverse);
		opacity: 0.08;
	}
</style>
