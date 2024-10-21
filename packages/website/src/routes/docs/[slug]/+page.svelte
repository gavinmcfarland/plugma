<script>
	import Code from '@/components/Code.svelte';
	import SvelteMarkdown from 'svelte-markdown';
	export let data;

	$: source = data.content;
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div>
	<SvelteMarkdown {source} renderers={{ code: Code }} />
</div>
