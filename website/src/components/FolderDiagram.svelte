<script>
</script>

<code>
	<ul>
		<slot></slot>
	</ul>
</code>

<style>
	ul :global(> :first-child::before),
	ul :global(> :first-child::after) {
		display: none;
	}
	ul :global(> :last-child) {
		padding-left: 0;
	}

	ul :global(li:last-child::before) {
		bottom: calc(52%);
	}
</style>
