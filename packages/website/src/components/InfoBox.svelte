<script lang="ts">
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="info-box">
	{@render children?.()}
	<!-- Renders the content inside the custom syntax -->
</div>

<style>
	.info-box {
		background-color: #e0f7fa;
		padding: 1rem;
		border-left: 4px solid #00796b;
		margin-bottom: 1rem;
	}
</style>
