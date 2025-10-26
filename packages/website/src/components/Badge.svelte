<!-- @migration-task Error while migrating Svelte code: $$props is used together with named props in a way that cannot be automatically migrated. -->
<script lang="ts">
	export let href: null | string = null;
</script>

{#if href}
	<a class="Badge {$$props.class}" {href}><slot /></a>
{:else}
	<span class="Badge {$$props.class}"><slot /></span>
{/if}

<style>
	.Badge {
		@apply rounded-full;
		align-items: center;
		background-color: hsl(var(--color-info-hsl) / 0.05);
		padding: 0 6px 0 8px;
		gap: 2px;
		display: inline-flex;
		color: hsl(var(--color-info-hsl));
		border: 1px solid hsl(var(--color-info-hsl) / 0.3);
		margin-bottom: 12px;
	}
</style>
