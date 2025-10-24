<script>
	import { page } from '$app/stores';
	import Badge from '@/components/Badge.svelte';
	import Button from '@/components/Button.svelte';
	import Card from '@/components/Card.svelte';
	import Code from '@/components/Code.svelte';
	import Icon from '@/components/Icon.svelte';
	import Meta from '@/components/Meta.svelte';
	import Section from '@/components/Section.svelte';
	import Banner from '@/components/Banner.svelte';
	import Code2 from '@/components/Code2.svelte';
</script>

<svelte:head>
	<title>Plugma — Take Figma plugin development to the next level</title>
	<Meta
		title="Plugma: Take Figma plugin development to the next level"
		description="Excelerate your plugin development with an all in one solution for developing and bundling Figma plugins."
		url={`https://plugma.dev${$page.url.pathname}`}
		type="website"
	/>
</svelte:head>

<div>
	<!-- <pre><button style="background: red; display: inline-block">
		<Icon svg="copy" />
	</button></pre> -->
	<!-- Navigation -->

	<Section class="border-t-0 text-primary">
		<div class="svg-background">
			<div class="gradient"></div>
		</div>
		<div class="max-w-6xl mx-auto">
			<div class="text-center">
				<Badge href="/whats-new">V2: What's new <Icon svg="arrow-right" size={16} /></Badge>
				<h1 class="text-4xl/tight md:text-7xl/tight text-center font-medium mb-4">
					Build Figma plugins<br /> without the hassle
				</h1>
				<p class="mb-10">Supports React, Svelte, Vue, and vanilla JS/TS</p>
				<Code2
					class_="max-w-fit mx-auto"
					persistCopyButton
					lang="bash"
					text="npm create plugma@latest"
				/>
				<Button class="mt-4 mx-auto" href="docs/getting-started">Get started</Button>
			</div>
		</div>
	</Section>

	<!-- <Section class="border-t-0 pt-0 md:pt-0">
		<h2 class="text-3xl sm:text-4xl text-center font-medium mb-8">Features</h2>

		<div class="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
			<Card>
				<Icon svg="bolt" size={48} strokeWidth={1.1} isAnimated opacity={1} />
				<h2 class="text-lg font-medium">Faster development</h2>
				<p>
					Accelerates development and improves debugging by eliminating the need to
					rebuild for every change.
				</p>
			</Card>

			<Card>
				<Icon svg="window" size={48} strokeWidth={1.1} isAnimated opacity={1} />
				<h2 class="text-lg font-medium">Browser preview</h2>
				<p>
					Preview in any browser during development using websockets to pass messages from
					Figma to the browser.
				</p>
			</Card>

			<Card>
				<Icon svg="vite-logo" size={48} strokeWidth={1.1} isAnimated opacity={1} />
				<h2 class="text-lg font-medium">Built with Vite</h2>
				<p>
					Built using Vite, it works seamlessly with most frameworks and offers support
					for numerous Vite and Rollup plugins.
				</p>
			</Card>
		</div>
	</Section> -->

	<Section class="border-t-0 pt-0 md:pt-0">
		<h2 class="text-3xl text-center font-medium mb-12">Why Choose Plugma</h2>

		<div class="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
			<Card>
				<div class="flex flex-col gap-3">
					<span class="flex gap-3 font-semibold"
						><Icon svg="terminal" size={24} opacity={1} />Start Building in Minutes</span
					>
					<p class="m-0">
						Skip the tedious setup process. Get from idea to working plugin in minutes,
						not hours. Focus on your plugin's functionality, not configuration.
					</p>
				</div>
			</Card>

			<Card>
				<div class="flex flex-col gap-3">
					<span class="flex gap-3 font-semibold"
						><Icon svg="globe" size={24} opacity={1} />Ship with Confidence</span
					>
					<p class="m-0">
						Test your plugin across all browsers before users see it. Catch bugs early
						and ensure consistent behavior everywhere, saving you from embarrassing
						post-launch fixes.
					</p>
				</div>
			</Card>

			<Card>
				<div class="flex flex-col gap-3">
					<span class="flex gap-3 font-semibold"
						><Icon svg="layout" size={24} opacity={1} />Debug Like a Pro</span
					>
					<p class="m-0">
						Stop wasting time switching between tools. Preview, test, and debug
						everything from one place. Clear data, minimize windows, and access
						developer tools instantly with <kbd>Cmd</kbd> + <kbd>Opt</kbd> +
						<kbd>J</kbd>.
					</p>
				</div>
			</Card>

			<Card>
				<div class="flex flex-col gap-3">
					<span class="flex gap-3 font-semibold"
						><Icon svg="copy" size={24} opacity={1} />Deploy Anywhere</span
					>
					<p class="m-0">
						Build once, deploy everywhere. Switch between staging, production, and
						testing environments instantly. No more manual config changes or deployment
						anxiety.
					</p>
				</div>
			</Card>

			<Card>
				<div class="flex flex-col gap-3">
					<span class="flex gap-3 font-semibold"
						><Icon svg="cloud-upload-alt" size={24} opacity={1} />Never Miss a Release</span
					>
					<p class="m-0">
						Keep your Figma plugin and GitHub releases perfectly synced. One command
						handles versioning and releases. Never lose track of what you've shipped
						again.
					</p>
				</div>
			</Card>

			<Card>
				<div class="flex flex-col gap-3">
					<span class="flex gap-3 font-semibold"
						><Icon svg="package" size={24} opacity={1} />Lightning-Fast Performance</span
					>
					<p class="m-0">
						Your users get blazing-fast plugins that load instantly. Powered by <b
							>Vite</b
						>, everything is optimized and inlined for maximum performance. No more slow
						loading or bloated bundles.
					</p>
				</div>
			</Card>

			<!-- <Card>
				<div class="flex flex-col gap-3">
					<span class="flex gap-3 font-semibold"
						><Icon svg="boolean-subtract" size={24} opacity={1} />First-Class Testing</span
					>
					<p class="m-0">
						Write fast, reliable unit tests with <b>Vitest</b> and run full end-to-end
						tests using <b>Playwright</b>, without ever leaving your development
						workflow. The first toolkit to bring comprehensive testing to Figma plugins.
					</p>
				</div>
			</Card> -->
		</div>
	</Section>

	<Section class="commands">
		<h2 class="text-3xl text-center font-medium mb-12">Everything You Need</h2>
		<div class="lg:max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
			<div>
				<h3 class="font-bold mb-2">Start dev server</h3>
				<Code2 class_="mb-1" lang="bash" text="plugma dev" />
				<p>
					Start your development server with hot reloading for instant UI updates and
					faster iteration cycles.
				</p>
			</div>
			<div>
				<h3 class="font-bold mb-2">Create a build</h3>
				<Code2 class_="mb-1" lang="bash" text="plugma build" />
				<p>
					Generate a production-ready, minified build optimized for publishing to the
					Figma community.
				</p>
			</div>
			<div>
				<h3 class="font-bold mb-2">Release to github</h3>
				<Code2 class_="mb-1" lang="bash" text="plugma release" />
				<p>
					Automatically manage versioning and track your plugin releases with seamless
					GitHub integration.
				</p>
			</div>
		</div>
	</Section>

	<Section>
		<div class="max-w-5xl mx-auto">
			<h2 class="text-3xl text-center font-medium mb-12">What people are saying</h2>
			<div class="mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-10 items-start">
				<div class="flex gap-4 items-start">
					<a href="https://x.com/gleb_sexy" class="mt-1">
						<img
							src="/UiC9AmCX_400x400.jpg"
							alt="Avatar"
							class="w-16 h-16 rounded-full max-w-none"
						/>
					</a>
					<div>
						<h3 class="font-bold mt-0 -mb-2">
							<a href="https://x.com/gleb_sexy">Gleb Sabirzyanov</a>
						</h3>
						<p>
							Plugma takes away the pain of setting up a plugin development
							environment. It's so effortless and requires zero config. Used it for
							multiple plugins already, I never had such a hassle-free environment
							before.
						</p>
					</div>
				</div>

				<div class="flex gap-4 items-start">
					<a href="https://x.com/chen_ed5557" class="mt-1">
						<img
							src="/glKCxNtj_400x400.jpg"
							alt="Avatar"
							class="w-16 h-16 rounded-full max-w-none"
						/>
					</a>
					<div>
						<h3 class="font-bold mt-0 -mb-2">
							<a href="https://x.com/chen_ed5557">Chen Chen</a>
						</h3>
						<p>
							Plugma elevates the developer experience for Figma plugins like never
							before. With features like HMR and browser preview, it saved me much
							time on debugging plugin UI.
						</p>
					</div>
				</div>
			</div>
		</div>
	</Section>
</div>

<style>
	.commands > .grid :first-child {
		margin-top: 0;
	}

	.commands > .grid :last-child {
		margin-bottom: 0;
	}

	.svg-background {
		position: absolute;
		top: 0;
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
</style>
