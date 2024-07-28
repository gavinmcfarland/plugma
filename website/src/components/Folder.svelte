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
	li {
		position: relative;
		margin-top: 0;
		padding-left: var(--em-2);
		/* background:
			var(--gradient) 0.4375rem 0 / 0.0625rem 100% no-repeat,
			var(--gradient) 0.4375rem 0.75em / 0.5rem 0.0625rem no-repeat; */
	}

	li::before {
		content: '';
		width: var(--em-1);
		min-height: 10px;
		display: block;
		/* background-color: red; */
		position: absolute;
		top: 0;
		bottom: 0;
		margin: 0;
		margin-left: calc(-0.75 * var(--em-2));
		padding: 0;
		/* opacity: 0.2; */
		border-left: 1px solid var(--border-color-tertiary);
		/* border-bottom: 1px solid red; */
	}

	li::after {
		content: '';
		width: var(--em-1);
		min-height: 10px;
		display: block;
		/* background-color: red; */
		position: absolute;
		top: 0;
		/* bottom: 0; */
		margin: 0;
		margin-left: calc(-0.75 * var(--em-2) + 1px);
		padding: 0;
		/* opacity: 0.2; */
		border-bottom: 1px solid var(--border-color-tertiary);
	}

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
	ul {
		margin-top: 0;
	}

	li.open {
		padding-bottom: var(--rem--1);
	}

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
