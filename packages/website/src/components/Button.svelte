<script lang="ts">
	export let href: string | null = null;
	export let target: string | null = null;
</script>

{#if href}
	<a class="Button px-6 py-4 rounded-full {$$props.class}" {href} {target}><slot></slot></a>
{:else}
	<button class="Button px-5 py-3 rounded-full">
		<slot></slot>
	</button>
{/if}

<style>
	.Button {
		background-color: var(--color-bg-reverse);
		color: var(--color-text-reverse);
		display: inline-block;
	}

	.Button:hover {
		background-color: var(--color-bg-hover);
	}
</style>
