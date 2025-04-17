<script>
	import { page } from '$app/stores';
	import Code from '@/components/Code.svelte';
	import Code2 from '@/components/Code2.svelte';
	import SvelteMarkdown from 'svelte-markdown';
	import MarkdownRenderer from '@/components/MarkdownRenderer.svelte';
	import MarkdownRenderer3 from '@/components/MarkdownRenderer3.svelte';
	import Heading from '@/components/Heading.svelte';
	import { onMount } from 'svelte';
	import Meta from '@/components/Meta.svelte';
	import MarkdownRenderer4 from '@/components/MarkdownRenderer4.svelte';
	import MarkdownRenderer5 from '@/components/MarkdownRenderer5.svelte';
	import MarkdownRenderer2 from '@/components/MarkdownRenderer2.svelte';
	import MarkdownRenderer6 from '@/components/MarkdownRenderer6.svelte';
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
	<Meta title={data.title} url={`https://plugma.dev${$page.url.pathname}`} type="article" />
</svelte:head>

<div>
	<!-- SvelteMarkdown doesn't process inline markdown but custom one isn't great either as it can't render nested elements -->
	<!-- <SvelteMarkdown
		{source}
		renderers={{
			code: Code
		}}
	/> -->
	<!-- <MarkdownRenderer
		markdown={source}
		components={{
			code: Code2
		}}
	/> -->
	<!-- <MarkdownRenderer2
		content={source}
		components={{
			code: Code2
		}}
	/> -->
	<!-- <MarkdownRenderer3
		{source}
		renderers={{
			code: Code2,
			heading: Heading
		}}
	/> -->
	<!-- <MarkdownRenderer4
		content={source}
		components={{
			code: Code2,
			heading: Heading
		}}
	/> -->
	<!-- <MarkdownRenderer5
		markdown={source}
		components={{
			code: Code2,
			heading: Heading
		}}
	/> -->
	<MarkdownRenderer6
		markdown={source}
		components={{
			code: Code2
		}}
	/>
</div>
