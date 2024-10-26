<script>
	import Badge from '@/components/Badge.svelte';
	import Code from '@/components/Code.svelte';
	import Icon from '@/components/Icon.svelte';
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
	<title>Plugma — What's next</title>
</svelte:head>

<div class="my-8">
	<h1 class="text-center text-3xl my-24">What's next</h1>
	<div class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-12 gap-9 px-4">
		<div
			class="min-h-80 border rounded-lg sm:col-span-12 lg:col-span-4 place-content-center place-items-center p-8 pt-0 flex flex-col relative overflow-hidden"
		>
			<div class="svg-background">
				<!-- Content of the page goes here -->
				<div class="gradient"></div>
			</div>
			<div class="text-center grow place-content-center">
				<h2 class="mb-4 text-8xl">V1</h2>
				<Badge>Try it now!</Badge>
			</div>
			<Code lang="bash" text="npm create plugma@lnext" class="w-full" persistCopyButton
			></Code>
		</div>
		<div
			class="border rounded-lg sm:col-span-12 lg:col-span-8 p-10 grid grid-cols-1 md:grid-cols-2 gap-9"
		>
			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="message-square" size={24} />Enhanced WebSockets</span
				>
				<p class="m-0">
					WebSocket messages are now queued until the connection is ready, making browser
					previews much more stable and responsive, even for complex plugins.
				</p>
			</div>
			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="copy" size={24} />Modes and Environments</span
				>
				<p class="m-0">
					Simplify builds with a single <code>vite.config.js</code> to manage main and UI code
					for dev and production modes. Customise freely to match your specific build needs.
				</p>
			</div>
			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="switch-alt" size={24} />Real-Time Theme Switching</span
				>
				<p class="m-0">
					Figma’s dark/light modes now update in real time, using a new iframe setup that
					directly syncs theme changes to your plugin UI without any delay.
				</p>
			</div>
			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="file" size={24} />Simplified Vite Configuration</span
				>
				<p class="m-0">
					Test various setups with the new <code>--mode</code> option and
					<code>.env</code> variables, allowing you to build, run, and debug for different
					environments with ease.
				</p>
			</div>
			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="briefcase" size={24} />Developer Tools</span
				>
				<p class="m-0">
					Previously, enabling developer tools required setting a flag before starting
					Plugma. Now, they’re just a keyboard shortcut away! Activate or hide developer
					tools instantly with <code class="whitespace-nowrap">Cmd + Opt + J</code>.
				</p>
			</div>
			<div class="flex flex-col gap-3">
				<span class="flex gap-3 font-semibold"
					><Icon svg="window" size={24} />Dedicated Preview Command</span
				>
				<p class="m-0">
					For those who frequently use browser previews, the new preview command minimises
					the plugin window in Figma, allowing you to focus entirely.
				</p>
			</div>
		</div>
	</div>
	<!-- <SvelteMarkdown
		{source}
		renderers={{
			code: Code
		}}
	/> -->
</div>

<style>
	* > :global(h3) {
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
</style>
