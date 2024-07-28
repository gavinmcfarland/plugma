<script>
	import Icon from './Icon.svelte';

	export let name;
</script>

<li><span><Icon color="#42AD00" size={12} strokeWidth={2} svg="file" />{name}</span></li>

<style>
	li {
		display: flex;
		position: relative;
		margin-top: 0;
		list-style: none;
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

	:global(.Icon) {
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
