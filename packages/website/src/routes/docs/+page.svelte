<script lang="ts">
	let { error } = $props();
</script>

{#if error}
	<p>Error: {error.message}</p>
{:else}
	<p>Redirecting...</p>
{/if}
