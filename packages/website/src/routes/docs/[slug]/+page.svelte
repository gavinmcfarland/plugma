<script>
	import Code from '@/components/Code.svelte';
	import SvelteMarkdown from 'svelte-markdown';
	export let data;

	// function replaceSyntax(data) {
	// 	data.content = data.content.replace(
	// 		/\[info\]([\s\S]*?)\[\/info\]/g,
	// 		'<info-placeholder>$1</info-placeholder>'
	// 	);
	// 	return data.content;
	// }

	$: source = data.content;
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div>
	<SvelteMarkdown
		{source}
		renderers={{
			code: Code
		}}
	/>
</div>

<style>
	* > :global(h3) {
		padding-bottom: 8px;
		border-bottom: 1px solid var(--color-border);
	}

	* > :global(.info) {
		display: flex;
		gap: 12px;
		/* border: 1px solid var(--color-border); */
		padding: 12px 16px;
		color: var(--color-text-secondary);
		/* padding-left: 64px; */
		background-color: var(--color-bg-secondary);
		@apply rounded-md my-6;
	}

	* > :global(.info :first-child) {
		margin-top: 0;
	}

	* > :global(.info :last-child) {
		margin-bottom: 0;
	}

	* > :global(.info)::before {
		content: '';
		display: flex;
		/* margin-top: 2px; */
		width: 24px;
		height: 24px;
		margin-left: -4px;
		flex-shrink: 0;
		background-image: url('/icon.info.svg');
	}
</style>
