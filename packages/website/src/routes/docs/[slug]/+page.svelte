<script>
	import Code from '@/components/Code.svelte';
	import SvelteMarkdown from 'svelte-markdown';
	import MarkdownRenderer from '@/components/MarkdownRenderer.svelte';
	import MarkdownRenderer2 from '@/components/MarkdownRenderer2.svelte';
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
	<!-- SvelteMarkdown doesn't process inline markdown but custom one isn't great either as it can't render nested elements -->
	<!-- <SvelteMarkdown
		{source}
		renderers={{
			code: Code
		}}
	/> -->
	<MarkdownRenderer
		markdown={source}
		components={{
			code: Code
		}}
	/>
	<!-- <MarkdownRenderer2
		content={source}
		components={{
			code: Code
		}}
	/> -->
</div>

<style>
	* > :global(.info) {
		/* display: flex; */
		position: relative;
		gap: 12px;
		/* border: 1px solid var(--color-border); */
		padding: 12px 16px;
		padding-left: 48px;
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
		position: absolute;
		left: 12px;
		content: '';
		display: flex;
		/* margin-top: 2px; */
		width: 24px;
		height: 24px;
		/* margin-left: -4px; */
		flex-shrink: 0;
		background-image: url('/icon.info.svg');
	}
</style>
