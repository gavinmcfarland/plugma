<script>
	export let error;
</script>

{#if error}
	<p>Error: {error.message}</p>
{:else}
	<p>Redirecting...</p>
{/if}
