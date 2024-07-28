<script>
	import Icon from './Icon.svelte';

	export let name;

	let open = false;

	if ($$slots.default) {
		open = true;
	}
</script>

<li class={open ? 'open' : ''} draggable="true">
	<span>
		{#if open}
			<Icon color="#42AD00" size={12} strokeWidth={2} svg="folder" />
		{:else}
			<Icon color="#42AD00" size={12} strokeWidth={2} svg="folder-open" />
		{/if}
		<span>{name}</span>
	</span>
	{#if open}
		<ul>
			<slot></slot>
		</ul>
	{/if}
</li>

<style>
	li,
	ul::marker {
		list-style: none;
	}

	ul,
	li {
		margin: 0;
	}

	li {
		position: relative;
	}

	ul {
		position: relative;
		padding-left: var(--em-2);
	}

	ul::before {
		content: '';
		width: 20px;
		/* background-color: red; */
		/* width: var(--em-1); */
		/* min-height: 10px; */
		display: block;
		position: absolute;
		top: 0;
		bottom: 21px;
		margin: 0;
		margin-left: calc(-01 * var(--em-2) + (12px / 2) - 1px);
		padding: 0;
		border-left: 1px solid var(--border-color-tertiary);
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
	/* li {
		position: relative;
		margin-top: 0;
		padding-left: var(--em-2);
	}

	li::before {
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

	span {
		display: flex;
		align-items: center;
		margin: 0;
	}

	/* li:first-child::before {
		display: none;
	} */

	/* li:first-child::before {
		display: none;
	} */
	/* ul {
		margin-top: 0;
	}

	li.open {
		padding-bottom: var(--rem--1);
	}
	*/
	:global(.Icon) {
		width: var(--em-2);
		vertical-align: middle;
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
