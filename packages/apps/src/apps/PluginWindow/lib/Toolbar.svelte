<script lang="ts">
	import { remoteClients } from '../../../shared/stores'
	export let options = null

	let isWindowMinimised

	if (window.runtimeData.command === 'preview') {
		isWindowMinimised = true
	}

	function handleWindowSize(event) {
		console.log('button clicked')

		if (isWindowMinimised) {
			parent.postMessage(
				{
					pluginMessage: { event: 'PLUGMA_MAXIMISE_WINDOW' },
					pluginId: '*',
				},
				'*',
			)
		} else {
			parent.postMessage(
				{
					pluginMessage: { event: 'PLUGMA_MINIMISE_WINDOW' },
					pluginId: '*',
				},
				'*',
			)
		}

		isWindowMinimised = !isWindowMinimised
	}
</script>

<!-- <div class="Toolbar-spacer"></div> -->
<div class="Toolbar">
	<button
		class="Button"
		on:click={(event) => {
			handleWindowSize(event)
		}}
	>
		{#if isWindowMinimised}
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
	</button>

	<div class="spacer"></div>

	{#if $remoteClients.length > 0}
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="8" y="10" width="8" height="4" rx="2" fill="#77C515" stroke="currentColor" />
		</svg>
	{:else}
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="8" y="10" width="8" height="4" rx="2" stroke="currentColor" />
		</svg>
	{/if}
</div>

<style>
	.Toolbar-spacer {
		height: 41px;
	}

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

	.Button {
		flex-grow: 0;
		position: relative;
		width: 24px;
		height: 24px;
		border-radius: 4px;
		border: none;
		padding: 0;
		background-color: transparent;
		color: inherit;
	}

	svg {
		flex-grow: 0;
	}

	/* .Button:hover {
		background-color: var(--figma-color-bg-secondary);
	} */

	.Button:hover::after {
		display: block;
		content: '';
		background-color: var(--figma-color-bg-inverse);
		opacity: 0.08;
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1;
		border-radius: 4px;
	}

	.spacer {
		flex-grow: 1;
	}
</style>
