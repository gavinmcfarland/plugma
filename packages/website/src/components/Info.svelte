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
		border-radius: 2px;
		border: 1px solid var(--border-color-tertiary, rgba(255, 255, 255, 0.25));
		background: var(--bg-color-raised, rgba(255, 255, 255, 0.1));
		padding: var(--rem-1);
	}
</style>
