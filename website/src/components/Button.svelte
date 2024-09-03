<script lang="ts">
	export let href: string | null = null;
	export let target: string | null = null;
</script>

{#if href}
	<a class="Button" {href} {target}><slot></slot></a>
{:else}
	<button class="Button">
		<slot></slot>
	</button>
{/if}
