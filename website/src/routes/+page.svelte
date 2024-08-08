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
	import Info from '../components/Info.svelte';

	import logo from '$lib/images/vite-logo.svg';
	import Card from '../components/Card.svelte';

	export let data;
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<!-- Navigation -->
<div class="Nav">
	<p class="Text">Plugma</p>
</div>

<div class="Hero">
	<div class="Badge">
		<p class="Text">New</p>
	</div>
	<h1 class="Text">Create Figma plugins without the boilerplate</h1>
	<div class="Code">
		<pre><code><span class="hljs-symbol">npm</span> create plugma@latest my-plugin</code></pre>
	</div>
</div>

<div class="Features">
	<Card>
		<div class="Image">
			<Icon svg="box" size={54} strokeWidth={1} color="#42AD00"></Icon>
		</div>
		<div class="Group">
			<p class="Text heading">Just works</p>
			<p class="Text">
				Just works, out of the box. No need to worry about inlining all the files. TypeScript
				supported.
			</p>
		</div>
	</Card>
	<Card>
		<div class="Image">
			<Icon svg="data-transfer-square" size={54} strokeWidth={1} color="#42AD00"></Icon>
		</div>
		<div class="Group">
			<p class="Text heading">Faster development</p>
			<p class="Text">
				Faster development and better debugging. Avoids the need to build to view every change.
			</p>
		</div>
	</Card>
	<Card>
		<div class="Image">
			<Icon svg="vite-logo" size={54} strokeWidth={1} color="#42AD00"></Icon>
		</div>
		<div class="Group green">
			<p class="Text heading">Built with Vite</p>
			<p class="Text">
				Built on the back of Vite. Works with most frameworks and supports lots of Vite and Rolup
				plugins.
			</p>
		</div>
	</Card>
</div>

<hr />

<div class="FeaturedVideo">
	<h2>Watch me create a plugin from scratch</h2>
	<p>See how easy it is to create a plugin from scratch.</p>
	<div class="Video"></div>
</div>

<style>
	.Nav {
		border-bottom: 1px solid rgba(0, 0, 0, 0.2);
		padding: 16px 11px;

		max-width: none !important;
		width: 100vw;
		box-sizing: border-box;
		position: relative;
		left: 50%;
		transform: translate(-50vw);
	}

	.Nav p {
		color: #000;
		font-family: 'Akkurat TT';
		font-size: 16px;
		font-style: normal;
		font-weight: 700;
		line-height: 125%;
		letter-spacing: -0.64px;
	}

	.Badge {
		border-radius: 48px;
		background: rgba(66, 173, 0, 0.1);

		display: flex;
		width: 220px;
		height: 28px;
		padding: 4px 55px;
		justify-content: center;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.Hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-block: 88px;
	}

	.Hero h1 {
		color: #000;
		text-align: center;
		font-family: 'Akkurat TT';
		font-size: 48px;
		font-style: normal;
		font-weight: 700;
		line-height: 125%; /* 60px */
		letter-spacing: -1.92px;
	}

	.Badge p {
		color: #000;
		font-family: 'Akkurat TT';
		font-size: 16px;
		font-style: normal;
		font-weight: 700;
		line-height: 125%; /* 20px */
		letter-spacing: -0.64px;
	}

	.Features {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.Video {
		border-radius: 8px;
		background: rgba(66, 173, 0, 0.1);
		aspect-ratio: 16 / 9;
		margin-top: 2em;
	}

	hr {
		border-color: rgba(0, 0, 0, 0.2);
	}
</style>
