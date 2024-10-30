<script>
	import Code from '@/components/Code.svelte';
	import SvelteMarkdown from 'svelte-markdown';
	import MarkdownRenderer from '@/components/MarkdownRenderer.svelte';
	import MarkdownRenderer2 from '@/components/MarkdownRenderer2.svelte';
	import MarkdownRenderer3 from '@/components/MarkdownRenderer3.svelte';
	import Heading from '@/components/Heading.svelte';
	import { onMount } from 'svelte';
	export let data;

	// function replaceSyntax(data) {
	// 	data.content = data.content.replace(
	// 		/\[info\]([\s\S]*?)\[\/info\]/g,
	// 		'<info-placeholder>$1</info-placeholder>'
	// 	);
	// 	return data.content;
	// }

	$: source = data.content;

	onMount(() => {});
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
	<!-- <MarkdownRenderer3
		{source}
		renderers={{
			code: Code,
			heading: Heading
		}}
	/> -->
</div>
