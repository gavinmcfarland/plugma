<script lang="ts">
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div>
	{@render children?.()}
</div>

<style>
	div {
		background-color: hsl(var(--color-info-hsl) / 1);
		padding: 8px 16px;
		font-size: 14px;
		text-align: center;
	}

	div :global(p) {
		margin: 0;
		color: var(--color-bg);
	}
</style>
