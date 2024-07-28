<script>
	import Counter from './Counter.svelte';
	import welcome from '$lib/images/svelte-welcome.webp';
	import welcome_fallback from '$lib/images/svelte-welcome.png';
	import Block from '../components/Block.svelte';
	import Code from '../components/Code.svelte';
	import Box from '../components/Box.svelte';
	import Icon from '../components/Icon.svelte';
	import FolderDiagram from '../components/FolderDiagram.svelte';
	import File from '../components/File.svelte';
	import Folder from '../components/Folder.svelte';

	export let data;
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<div class="Header fullwidth">
	<div style="text-align: center">
		<h1>Plugma</h1>
		<p class="Header_Tagline">Create Figma plugins without the boilerplate</p>
		<!-- <a class="Button" href="https://github.com/gavinmcfarland/plugma">View on Github</a> -->
	</div>
</div>

<hr />

<Box display="flex" flexDirection="column" alignItems="center">
	<Box display="grid" gridTemplateColumns="repeat(26, 1fr)" gap="var(--em--1)" maxWidth="1200px">
		<Box
			border="1px solid var(--border-color-tertiary)"
			element="section"
			display="grid"
			padding="var(--rem-4) 0"
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
			gap="var(--em-0)"
			gridTemplateColumns="subgrid"
			gridColumn="span 26">
			<!-- <Box gridColumn="span 5">{@html data.features.content}</Box> -->
			<Box gridColumn="10 /span 10">
				{@html data['get-started'].content}
			</Box>
		</Box>

		<Box display="grid" gridTemplateColumns="subgrid" gridColumn="span 26">
			<Box
				border="1px solid var(--border-color-tertiary)"
				element="section"
				display="grid"
				justifyContent="center"
				gap="var(--em-0)"
				gridColumn="span 14"
				gridTemplateColumns="subgrid"
				padding="var(--rem-4) 0">
				<!-- <Box gridColumn="span 5">{@html data.features.content}</Box> -->
				<Box gridColumn="span 5"><h2 style="margin-left: var(--em-0); margin-top: 0;">Dev</h2></Box>
				<Box gridColumn="span 7">
					{@html data['developing'].content}
				</Box>
			</Box>

			<Box
				border="1px solid var(--border-color-tertiary)"
				element="section"
				display="grid"
				padding="var(--rem-4) 0"
				justifyContent="center"
				gap="var(--em-0)"
				gridColumn="span 12"
				gridTemplateColumns="subgrid">
			</Box>
		</Box>

		<Box
			border="1px solid var(--border-color-tertiary)"
			element="section"
			display="grid"
			gridTemplateColumns="subgrid"
			padding="var(--rem-4) 0"
			justifyContent="center"
			gridColumn="span 26">
			<!-- <Box gridColumn="span 5">{@html data.features.content}</Box> -->
			<Box gridColumn="span 9"
				><h2 style="margin-left: var(--em-0); margin-top: 0;">Folder structure</h2></Box>
			<Box gridColumn="span 10">
				<FolderDiagram>
					<Folder name="my-app">
						<Folder name="dist/" />
						<Folder name="src/">
							<File name="code.ts" />
							<File name="ui.ts" />
							<File name="styles.css" />
						</Folder>
						<File name="README.md" />
						<File name="package.json" />
						<File name="tsconfig.js" />
						<File name="vite.config.js" />
					</Folder>
				</FolderDiagram>
			</Box>
		</Box>

		<Box
			border="1px solid var(--border-color-tertiary)"
			element="section"
			display="grid"
			gridTemplateColumns="subgrid"
			padding="var(--rem-4) 0"
			justifyContent="center"
			gridColumn="span 26">
			<!-- <Box gridColumn="span 5">{@html data.features.content}</Box> -->
			<Box gridColumn="span 9"><h2 style="margin-left: var(--em-0); margin-top: 0;">Build</h2></Box>
			<Box gridColumn="span 10">
				{@html data['building'].content}
			</Box>
		</Box>
	</Box>
</Box>
