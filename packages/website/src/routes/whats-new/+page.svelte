<script lang="ts">
	import { page } from '$app/stores';
	import Badge from '@/components/Badge.svelte';
	import Code from '@/components/Code.svelte';
	import Icon from '@/components/Icon.svelte';
	import Meta from '@/components/Meta.svelte';
	let { data } = $props();

	
	// 	data.content = data.content.replace(
	// 		/\[info\]([\s\S]*?)\[\/info\]/g,
	// 		'<info-placeholder>$1</info-placeholder>'
	// 	);
	// 	return data.content;
	// }
</script>

<svelte:head>
	<title>Plugma: What's new</title>
	<Meta
		title="Plugma: What's new"
		description="Excelerate your plugin develop with an all in one solution for developing and bundling Figma plugins."
		url={`https://plugma.dev${$page.url.pathname}`}
		type="article"
	/>
</svelte:head>

<div class="my-8 mx-4">
	<h1 class="text-center text-3xl my-24">What's new</h1>
	<div class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-12 gap-9">
		<div
			class="min-h-80 border rounded-lg sm:col-span-12 lg:col-span-4 place-content-center place-items-center p-10 pt-0 flex flex-col relative overflow-hidden"
		>
			<div class="svg-background">
				<!-- Content of the page goes here -->
				<div class="gradient"></div>
			</div>
			<div class="text-center grow place-content-center">
				<h2 class="text-8xl font-semibold">V2</h2>
				<Badge class="mt-2">Try it now!</Badge>
			</div>
			<Code lang="bash" text="npm create plugma@next" class="w-full" persistCopyButton></Code>
		</div>
		<div
			class="border rounded-lg sm:col-span-12 lg:col-span-8 p-10 grid grid-cols-1 md:grid-cols-2 gap-9"
		>
			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="clipboard-check" size={24} opacity={1} />Unit Testing</span
				>
				<p class="m-0">
					Test the live Figma API using Vitest. Write tests with files that end with
					<code>.test.ts</code> and run tests using the new <code>test</code> command. Your
					tests run directly in the Figma Desktop app, giving you access to the real Figma
					API.
				</p>
			</div>

			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="screen-control" size={24} opacity={1} />End to End Testing</span
				>
				<p class="m-0">
					Test your UI with Playwright. Record and run end-to-end tests with Playwright's
					tools. Use the <code>playwright test</code> command to run your tests, or
					<code>playwright codegen</code> to record new tests interactively.
				</p>
			</div>

			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="globe" size={24} opacity={1} />Reliable Browser Preview</span
				>
				<p class="m-0">
					We've improved the browser preview's reliability and responsiveness. Previously,
					missed messages and performance issues could occur if either party wasn't
					available.
				</p>
			</div>

			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="apps" size={24} opacity={1} />Enhanced Bundling Config</span
				>

				<!-- <p class="m-0">
					Better support for different contexts using a special <code>context</code>
					option. You can now specify different configurations for <code>main</code> and
					<code>ui</code> with a single <code>vite.config.js</code> file.
				</p> -->
				<p class="m-0">
					You can now specify different configurations for both the <code>main</code> code
					and <code>ui</code> with a <code>vite.config.main.js</code> and
					<code>vite.config.ui.js</code> file respectively.
				</p>
			</div>

			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="layout" size={24} opacity={1} />Custom Template</span
				>
				<p class="m-0">
					You can now provide a custom <code>index.html</code> template. This is useful if
					you need to include additional frameworks or libraries in your plugin.
				</p>
			</div>

			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="bug" size={24} opacity={1} />Squashed Bugs</span
				>
				<p class="m-0">
					Bug fixes and improvements make your development experience more reliable.
					Changes to
					<code>manifest.json</code> now trigger rebuilds automatically.
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	* > :global(h3) {
		border-bottom: 1px solid var(--color-border);
	}
	.svg-background {
		position: absolute;
		top: -8px;
		bottom: 0;
		left: -8px;
		right: 0;
		background-image: url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg' %3E%3Cg opacity='0.2'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M24 19H23V23H19V24H23V28H24V24H28V23H24V19Z' fill='black'%3E%3C/path%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M0 19H-1V23H-5V24H-1V28H0V24H4V23H0V19Z' fill='black'%3E%3C/path%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M24 43H23V47H19V48H23V52H24V48H28V47H24V43Z' fill='black'%3E%3C/path%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M0 43H-1V47H-5V48H-1V52H0V48H4V47H0V43Z' fill='black'%3E%3C/path%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M24 -5H23V-1H19V0H23V4H24V0H28V-1H24V-5Z' fill='black'%3E%3C/path%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M48 19H47V23H43V24H47V28H48V24H52V23H48V19Z' fill='black'%3E%3C/path%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M48 43H47V47H43V48H47V52H48V48H52V47H48V43Z' fill='black'%3E%3C/path%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M48 -5H47V-1H43V0H47V4H48V0H52V-1H48V-5Z' fill='black'%3E%3C/path%3E%3C/g%3E%3C/svg%3E%0A");
		background-repeat: repeat; /* This will tile the background */
		background-size: auto;
		z-index: -1;
	}

	@media (prefers-color-scheme: dark) {
		.svg-background {
			background-image: url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg' %3E%3Cg opacity='0.3'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M24 19H23V23H19V24H23V28H24V24H28V23H24V19Z' fill='white'%3E%3C/path%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M0 19H-1V23H-5V24H-1V28H0V24H4V23H0V19Z' fill='white'%3E%3C/path%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M24 43H23V47H19V48H23V52H24V48H28V47H24V43Z' fill='white'%3E%3C/path%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M0 43H-1V47H-5V48H-1V52H0V48H4V47H0V43Z' fill='white'%3E%3C/path%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M24 -5H23V-1H19V0H23V4H24V0H28V-1H24V-5Z' fill='white'%3E%3C/path%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M48 19H47V23H43V24H47V28H48V24H52V23H48V19Z' fill='white'%3E%3C/path%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M48 43H47V47H43V48H47V52H48V48H52V47H48V43Z' fill='white'%3E%3C/path%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M48 -5H47V-1H43V0H47V4H48V0H52V-1H48V-5Z' fill='white'%3E%3C/path%3E%3C/g%3E%3C/svg%3E%0A");
		}
	}

	.gradient {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		/* background-color: red; */
		background: linear-gradient(0deg, var(--color-bg), transparent),
			linear-gradient(-90deg, var(--color-bg), transparent);
	}

	* :global(.Code) {
		margin-bottom: 0;
		margin-top: 0;
	}
</style>
