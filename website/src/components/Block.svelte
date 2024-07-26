<section class="host text-gap-1">
	<div class="header"><slot name="header"></slot></div>
	<div class="content"><slot name="content"></slot></div>
</section>

<style>
	.host {
		--cols: 8;
		display: grid;
        grid-template-columns: repeat(var(--cols), 1fr);
		border-top: 1px solid var(--border-color);
		padding: var(--rem-1);
	}

	.header {
		grid-column: span 3;

	}
	.content {
		grid-column: span 5;
	}
</style>
