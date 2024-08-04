<script>
	import Icon from './Icon.svelte';
</script>

<div class="Card">
	<slot></slot>
</div>

<style>
	.Card {
		border-radius: 2px;
		border: 1px solid rgba(0, 0, 0, 0.2);

		display: flex;
		padding: 40px;
		align-items: flex-start;
		gap: 40px;
		flex-shrink: 0;
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
