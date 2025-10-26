<script lang="ts">
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<code>
	<ul>
		{@render children?.()}
	</ul>
</code>

<style>
	ul > :global(li:first-child::after) {
		display: none !important;
	}
	/* ul :global(> :first-child::before),
	ul :global(> :first-child::after) {
		display: none;
	}
	ul :global(> :last-child) {
		padding-left: 0;
	}

	ul :global(li:last-child::before) {
		bottom: 50%;
		border-left: none;
	}

	ul :global(li:last-child::after) {
		margin-left: calc(-0.75 * var(--em-2));
		border-left: 1px solid var(--border-color-tertiary);
	} */

	/* li:last-child::after {

	}
	ul:last-child {
		color: red;
	} */
</style>
