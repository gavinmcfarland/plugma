<script>
	import Counter from './Counter.svelte';
	import welcome from '$lib/images/svelte-welcome.webp';
	import welcome_fallback from '$lib/images/svelte-welcome.png';
	import Block from '../components/Block.svelte';
	import Code from '../components/Code.svelte';
	import Box from '../components/Box.svelte';
	import Icon from '../components/Icon.svelte';

	export let data;
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<div class="Header fullwidth">
		<div style="text-align: center">
			<h1>Plugma</h1>
			<p class="Header_Tagline">Simplify Figma plugin development</p>
			<!-- <a class="Button" href="https://github.com/gavinmcfarland/plugma">View on Github</a> -->
		</div>
		<Box display="grid" gridTemplateColumns="repeat(9, 1fr)">
			<Box
				display="flex"
				alignItems="center"
				justifyContent="center"
				flexDirection="column"
				gridColumn="span 3">
				<Icon icon="folder" size={100} />

				<p>
					Just works, out of the box. No need to worry about inlining all the files. TypeScript
					supported.
				</p>
			</Box>
			<Box
				display="flex"
				alignItems="center"
				justifyContent="center"
				flexDirection="column"
				gridColumn="span 3">
				<Icon icon="small-globe" size={100} />

				<p>
					Faster development and better debugging. Avoids the need to build to view every change.
				</p>
			</Box>
			<Box
				display="flex"
				alignItems="center"
				justifyContent="center"
				flexDirection="column"
				gridColumn="span 3">
				<Icon icon="frame" size={100} />

				<p>
					Built on the back of Vite. Works with most frameworks and supports lots of Vite and Rolup
					plugins.
				</p>
			</Box>
		</Box>
	</div>

	<hr />

	<Box element="section" display="grid" gridTemplateColumns="repeat(8, 1fr)" padding="var(--rem-2)">
		<h2 style:grid-column="span 3">Getting started</h2>
		<Box gridColumn="span 5">{@html data.features.content}</Box>
	</Box>

	<hr />

	<Box element="section" display="grid" gridTemplateColumns="repeat(8, 1fr)" padding="var(--rem-2)">
		<h2 style:grid-column="span 3">Development</h2>
		<Box gridColumn="span 5">
			<p>Develop locally and preview your plugin UI in any browser</p>
			<Code
				lang="shell"
				text="npm run dev

Plugma v0.0.29

ui.html file created!
manifest.json file created!
main.js file created!

Preview: http://localhost:3123/" />
			<p>Open the Figma desktop app and import the plugin</p>
			<Code lang="bash" text="npm run dev -- -p 4000" />
		</Box>
	</Box>

	<hr />

	<Box element="section" display="grid" gridTemplateColumns="repeat(8, 1fr)" padding="var(--rem-2)">
		<h2 style:grid-column="span 3">Build</h2>
		<Box gridColumn="span 5">
			<p>Create a build before publishing</p>
			<Code lang="bash" text="npm run build" />
			<p>Watch for changes while building</p>
			<Code lang="bash" text="npm run build -- -w" />
			<p>Inject plugin version data on build</p>
			<Code lang="bash" text="npm run build -- -i" />
		</Box>
	</Box>
</section>
