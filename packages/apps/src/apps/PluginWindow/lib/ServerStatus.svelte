<script lang="ts">
	export let message: string | null = null
</script>

<div id="plugma-status" class="container">
	<div class="panel">
		<div class="server-not-active">
			<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M15.3463 8.16209C15.633 7.65235 16.3669 7.65235 16.6536 8.16209L24.3713 21.8823C24.6525 22.3822 24.2912 23 23.7176 23H8.28234C7.70872 23 7.34744 22.3822 7.62866 21.8823L15.3463 8.16209ZM16 12.3817C16.497 12.3817 16.9 12.7847 16.9 13.2817V16.3695C16.9 16.8666 16.497 17.2695 16 17.2695C15.5029 17.2695 15.1 16.8666 15.1 16.3695V13.2817C15.1 12.7847 15.5029 12.3817 16 12.3817ZM17.1 20C17.1 19.3925 16.6075 18.9 16 18.9C15.3924 18.9 14.9 19.3925 14.9 20V20.0685C14.9 20.6761 15.3924 21.1685 16 21.1685C16.6075 21.1685 17.1 20.6761 17.1 20.0685V20Z"
					fill="currentColor"
					fill-opacity="0.8"
				/>
			</svg>
			{#if message}
				{message}
			{:else}
				<p>Dev server inactive</p>
			{/if}
		</div>
	</div>
</div>

<style>
	#plugma-status {
		z-index: 999999;
		position: absolute;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
		padding: 16px;
		background-color: var(--figma-color-bg);
	}

	.panel {
		display: flex;
		background-color: var(--figma-color-bg-brand-tertiary);
		border: 1px solid var(--figma-color-border);
		padding: 8px;
		border-radius: 4px;
		color: var(--figma-color-text);
		font-family: Inter, system-ui, Helvetica, Arial, sans-serif;
		font-display: optional;
		font-size: 12px;
		box-sizing: border-box;
		/* 11/16 */
		justify-content: center;
		align-items: center;
		height: 100%;
	}

	.server-not-active {
		display: flex;
		gap: 4px;
		align-items: center;
	}
</style>
