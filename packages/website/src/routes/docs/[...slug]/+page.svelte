<script lang="ts">
	import { page } from '$app/state';
	import Code from '@/components/Code.svelte';
	import Code2 from '@/components/Code2.svelte';
	// import SvelteMarkdown from 'svelte-markdown';
	// import MarkdownRenderer from '@/components/MarkdownRenderer.svelte';
	// import MarkdownRenderer3 from '@/components/MarkdownRenderer3.svelte';
	import Heading from '@/components/Heading.svelte';
	import { onMount } from 'svelte';
	import Meta from '@/components/Meta.svelte';
	// import MarkdownRenderer4 from '@/components/MarkdownRenderer4.svelte';
	// import MarkdownRenderer5 from '@/components/MarkdownRenderer5.svelte';
	// import MarkdownRenderer2 from '@/components/MarkdownRenderer2.svelte';
	import MarkdownRenderer6 from '@/components/MarkdownRenderer6.svelte';
	let { data } = $props();

	// function replaceSyntax(data) {
	// 	data.content = data.content.replace(
	// 		/\[info\]([\s\S]*?)\[\/info\]/g,
	// 		'<info-placeholder>$1</info-placeholder>'
	// 	);
	// 	return data.content;
	// }

	let currentHeading: HTMLElement | null = $state(null);

	function logFirstH2InView() {
		const isInViewport = (element) => {
			let threashold = 100;
			const rect = element.getBoundingClientRect();
			return (
				rect.top >= threashold &&
				rect.left >= 0 &&
				rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
				rect.right <= (window.innerWidth || document.documentElement.clientWidth)
			);
		};

		const handleScroll = () => {
			const h2Elements = document.querySelectorAll('h2');
			let found = false;

			for (let i = 0; i < h2Elements.length; i++) {
				if (isInViewport(h2Elements[i])) {
					currentHeading = h2Elements[i];
					found = true;
					break;
				}
			}
		};

		// Add event listener for scroll
		window.addEventListener('scroll', handleScroll);

		// Call the function immediately after content is rendered
		setTimeout(handleScroll, 0);

		// Return cleanup function
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}

	let source = $derived(data.content);

	// Make the function reactive to data changes
	$effect(() => {
		// Access data to make the effect reactive
		const _ = data;
		// Reset current heading when data changes
		currentHeading = null;
		// Re-run the heading detection
		const cleanup = logFirstH2InView();
		return cleanup;
	});
</script>

<svelte:head>
	<title>{data.title}</title>
	<Meta title={data.title} url={`https://plugma.dev${page.url.pathname}`} type="article" />
</svelte:head>

<div class="md:flex gap-6 relative">
	<div class="md:w-[220px] grow-0 shrink-0 md:order-2 mb-8">
		{#if data.headings && data.headings.length > 0}
			<div class="md:fixed md:left-[40dw] md:w-[220px]">
				<p class="text-sm mt-0 font-semibold" style="margin-top: 0px">On this page</p>

				<ul class="blank-list">
					{#each data.headings as heading}
						<li>
							<div class="text-ellipsis overflow-hidden">
								<a
									href={`${heading.anchor}`}
									class="hover:underline text-sm capitalize text-nowrap {'#' +
										currentHeading?.id ===
									heading.anchor
										? 'active'
										: ''}"
								>
									{heading.text}
								</a>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>

	<div class="grow-0 shrink min-w-0 md:order-1">
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
</div>
