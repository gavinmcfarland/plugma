<script lang="ts">
	export let href: string | null = null
	export let target: string | null = null
</script>

{#if href}
	<a class="Button" {href} {target}><slot></slot></a>
{:else}
	<button class="Button px-5 py-3 rounded-full">
		<slot></slot>
	</button>
{/if}

<style>
	.Button {
		background-color: var(--color-bg-reverse);
		color: var(--color-text-reverse);
	}
</style>
