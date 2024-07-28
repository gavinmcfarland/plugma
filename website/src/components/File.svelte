<script>
	import Icon from './Icon.svelte';

	export let name;
</script>

<li draggable="true">
	<span><Icon color="#42AD00" size={12} strokeWidth={2} svg="file" />{name}</span>
</li>

<style>
	li {
		display: flex;
		position: relative;
		margin-top: 0;
		list-style: none;
		/* padding-left: var(--em-2); */
	}

	li::after {
		content: '';
		width: var(--em-1);
		min-height: 10px;
		display: block;
		position: absolute;
		top: 0;

		margin: 0;
		margin-left: calc(-01 * var(--em-2) + (12px / 2));
		padding: 0;

		border-bottom: 1px solid var(--border-color-tertiary);
	}

	/* li::before {
		content: '';
		width: var(--em-1);
		min-height: 10px;
		display: block;

		position: absolute;
		top: 0;
		bottom: 0;
		margin: 0;
		margin-left: calc(-0.75 * var(--em-2));
		padding: 0;

		border-left: 1px solid var(--border-color-tertiary);

	} */

	/* li::after {
		content: '';
		width: var(--em-1);
		min-height: 10px;
		display: block;
		position: absolute;
		top: 0;

		margin: 0;
		margin-left: calc(-0.75 * var(--em-2) + 1px);
		padding: 0;

		border-bottom: 1px solid var(--border-color-tertiary);
	} */

	span {
		display: flex;
		align-items: center;
		margin: 0;
	}

	:global(.Icon) {
		vertical-align: middle;
	}

	li:last-child::after {
		border-left: 1px solid var(--border-color-tertiary);
		border-bottom: 1px solid var(--border-color-tertiary);
		margin-left: calc(-1 * var(--em-2) + (12px / 2) - 1px);
	}

	/* li::before {
		content: '';
		display: inline-block;
		width: 20px;
		height: 20px;
		margin-right: var(--em-0);
		background-color: red;
	} */
</style>
