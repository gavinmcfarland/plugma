<script>
	import Icon from './Icon.svelte';
</script>

<div class="Card">
	<slot></slot>
</div>

<style>
	.Card {
		border-radius: 2px;
		border: 1px solid var(--border-color-tertiary);

		display: flex;
		padding: var(--size-8);
		align-items: flex-start;
		gap: var(--size-8);
	}

	:global(.Card .Text.heading) {
		color: #000;
		font-family: 'Akkurat TT';
		font-size: 17px;
		font-style: normal;
		font-weight: 700;
		line-height: 26px; /* 152.941% */
		letter-spacing: -0.17px;
	}
</style>
