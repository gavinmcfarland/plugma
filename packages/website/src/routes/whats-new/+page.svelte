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

<div class="my-8">
	<h1 class="text-center text-3xl my-24">What's new</h1>
	<div class="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-12 gap-9">
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
			<Code lang="bash" text="npm create plugma@latest" class="w-full" persistCopyButton
			></Code>
		</div>
		<div
			class="border rounded-lg sm:col-span-12 lg:col-span-8 p-10 grid grid-cols-1 md:grid-cols-2 gap-9"
		>
			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="apps" size={24} opacity={1} />Widget Support</span
				>
				<p class="m-0">
					Full support for Figma widgets with a unified CLI for both plugins and widgets.
					Multiple templates showcase real use cases and demonstrate how to use the Figma
					API effectively for different scenarios.
				</p>
			</div>

			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="apps" size={24} opacity={1} />Context-Aware Bundling</span
				>
				<p class="m-0">
					Configure different bundling options for main and UI code using the <code
						>context</code
					>
					option in your <code>vite.config.js</code>. Apply Vite plugins conditionally
					based on whether you're building the main thread or UI code.
				</p>
			</div>

			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="terminal" size={24} opacity={1} />Minimal Configuration</span
				>
				<p class="m-0">
					No more manual network access configuration in your manifest file. WebSocket and
					browser preview are enabled automatically. True zero-config approach means you
					can start building immediately without setup hassles.
				</p>
			</div>

			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="globe" size={24} opacity={1} />Rock-Solid Browser Preview</span
				>
				<p class="m-0">
					WebSocket connections now wait until fully established before sending messages.
					Dark/light mode syncs instantly, and you can preview with minimized plugin
					windows to keep your workspace clean.
				</p>
			</div>

			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="layout" size={24} opacity={1} />Brand New CLI Wizard</span
				>
				<p class="m-0">
					A brand new CLI wizard that supports adding integrations and installing using
					any package manager. Streamlined commands make development faster than ever with
					automatic dependency management and intelligent package manager detection.
				</p>
			</div>

			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="layout" size={24} opacity={1} />Custom HTML Templates</span
				>
				<p class="m-0">
					Specify your own HTML template for entry files, giving you complete control over
					the initial structure. Perfect for advanced users who need custom frameworks or
					libraries that require specific HTML setup.
				</p>
			</div>

			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="bug" size={24} opacity={1} />Enhanced Developer Experience</span
				>
				<p class="m-0">
					Better source mapping for main code makes debugging easier. Chrome DevTools
					workspace integration lets you edit files directly from the browser. Improved
					CLI output and error formatting provide clearer feedback during development.
				</p>
			</div>

			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="package" size={24} opacity={1} />One-Click Integrations</span
				>
				<p class="m-0">
					Add powerful tools instantly using the CLI. Choose from Tailwind CSS, Shadcn UI,
					Prettier, ESLint, Vitest, and Playwright. Each integration comes with
					pre-configured setup and example code.
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
		background:
			linear-gradient(0deg, var(--color-bg), transparent),
			linear-gradient(-90deg, var(--color-bg), transparent);
	}

	* :global(.Code) {
		margin-bottom: 0;
		margin-top: 0;
	}
</style>
