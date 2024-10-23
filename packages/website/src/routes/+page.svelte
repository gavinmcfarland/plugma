<script>
	import Button from '@/components/Button.svelte';
	import Card from '@/components/Card.svelte';
	import Code from '@/components/Code.svelte';
	import Icon from '@/components/Icon.svelte';
	import Section from '@/components/Section.svelte';
</script>

<svelte:head>
	<title>Plugma — Take Figma plugin development to the next level</title>
</svelte:head>

<div>
	<!-- <pre><button style="background: red; display: inline-block">
		<Icon svg="copy" />
	</button></pre> -->
	<!-- Navigation -->

	<Section class="border-t-0 text-primary">
		<div class="svg-background">
			<!-- Content of the page goes here -->
			<div class="gradient"></div>
		</div>
		<div class="max-w-6xl mx-auto">
			<div class="text-center">
				<h1 class="text-5xl/tight md:text-7xl/tight text-center font-medium mb-6">
					Create Figma plugins <br />without the boilerplate
				</h1>
				<p class="mb-6">Supports React, Svelte, Vue, and JavaScript</p>
				<Code
					class="max-w-fit mx-auto"
					persistCopyButton
					lang="js"
					text="npm create plugma@latest"
				/>
				<Button href="docs/getting-started">Get started</Button>
			</div>
		</div>
	</Section>

	<Section class="border-t-0 md:pt-0">
		<h2 class="text-4xl sm:text-4xl text-center font-medium mb-8">Features</h2>

		<div class="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
			<Card>
				<Icon svg="bolt" size={48} strokeWidth={1.1} />
				<h2 class="text-lg font-medium">Faster development</h2>
				<p>
					Accelerates development and improves debugging by eliminating the need to
					rebuild for every change.
				</p>
			</Card>

			<Card>
				<Icon svg="window" size={48} strokeWidth={1.1} />
				<h2 class="text-lg font-medium">Browser preview</h2>
				<p>
					Preview in any browser during development using websockets to pass messages from
					Figma to the browser.
				</p>
			</Card>

			<Card>
				<Icon svg="vite-logo" size={48} strokeWidth={1.1} />
				<h2 class="text-lg font-medium">Built with Vite</h2>
				<p>
					Built using Vite, it works seamlessly with most frameworks and offers support
					for numerous Vite and Rollup plugins.
				</p>
			</Card>
		</div>
	</Section>

	<Section>
		<h2 class="text-4xl text-center font-medium mb-12">Commands</h2>
		<div class="lg:max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
			<div>
				<h4 class="font-bold mb-2">Start dev server</h4>
				<Code class="mb-1" lang="js" text="dev" />
				<p class="-mt-6">
					Development is faster because it doesn’t require a rebuild for each change.
				</p>
			</div>
			<div>
				<h4 class="font-bold mb-2">Create a build</h4>
				<Code class="mb-1" lang="js" text="build" />
				<p class="-mt-6">When you're ready to publish create a build which is minified.</p>
			</div>
			<div>
				<h4 class="font-bold mb-2">Preview in any browser</h4>
				<Code class="mb-1" lang="js" text="preview" />
				<p class="-mt-6">Debug and test across different environments using websockets.</p>
			</div>
			<div>
				<h4 class="font-bold mb-2">Release to github</h4>
				<Code class="mb-1" lang="js" text="release" />
				<p class="-mt-6">
					A built in command that allows you to keep track of your releases.
				</p>
			</div>
		</div>
	</Section>

	<!-- <Section>
		<div class="max-w-5xl mx-auto">

			<h2 class="text-4xl font-medium font-poppins leading-[90px] mb-4 text-center">
				What people are saying
			</h2>
			<div class="mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-10 items-start">
				<div class="flex gap-4 items-start">
					<a href="https://x.com/gleb_sexy" class="mt-1">
						<img
							src="https://pbs.twimg.com/profile_images/1589100999091822593/d9zD6NSX_bigger.jpg"
							alt="Avatar"
							class="w-16 h-16 rounded-full max-w-none"
						/>
					</a>
					<div>
						<h5 class="font-bold mt-0 -mb-2">
							<a href="https://x.com/gleb_sexy">Gleb Sabirzyanov</a>
						</h5>
						<p>
							Plugma takes away the pain of setting up plugin development environment.
							It's so effortless and requires zero config. Used it for multiple
							plugins already, I never had such a hassle-free environment before.
						</p>
					</div>
				</div>

			</div>

		</div>
	</Section> -->
</div>

<style>
	.svg-background {
		position: absolute;
		top: 0;
		bottom: 0;
		left: -8px;
		right: 0;
		background-image: url('/pattern.svg');
		background-repeat: repeat; /* This will tile the background */
		background-size: auto;
		z-index: -1;
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
