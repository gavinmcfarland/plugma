<script>
	import Icon from '../../components/Icon.svelte';
	import Card from '../../components/Card.svelte';
	import Button from '../../components/Button.svelte';
	import PluginScreenshot from '$lib/images/plugin-screenshot.svg';

	export let data;
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<!-- Navigation -->
<div class="Nav">
	<p class="Text">Figlet</p>
</div>

<div class="Hero">
	<p class="Text" style="font-size: var(--font-size-2); padding-top: var(--size-em-4)">
		Play, learn, share
	</p>
	<h1
		class="Text"
		style="
	margin-top: var(--size-em-0);
	margin-bottom: var(--size-em-3);
	">
		Your sandbox for <br />developing in Figma
	</h1>
	<Button target="_blank" href="https://www.figma.com/community/plugin/1215620774867583125/figlet"
		>Try now</Button>
	<div class="shadow" style="margin-top: var(--size-em-15)">
		<img src={PluginScreenshot} alt="Screenshot of plugin" />
	</div>
</div>

<div
	class="Section"
	style="color: white;
		background-color: #9747ff;">
	<h2>Intuitive code editor</h2>
	<p>Beautifully crafted code editor that’s quick and easy to use.</p>
	<div
		style="display: flex; gap: var(--size-8); margin-top: var(--size-em-15); max-width: 800px; gap: var(--size-10)">
		<div>
			<div class="box" style="aspect-ratio: 1 / 1"></div>
			<p>Your code samples automatically saved in the cloud</p>
		</div>
		<div>
			<div class="box" style="aspect-ratio: 1 / 1"></div>
			<p>Your code samples automatically saved in the cloud</p>
		</div>
		<div>
			<div class="box" style="aspect-ratio: 1 / 1"></div>
			<p>Your code samples automatically saved in the cloud</p>
		</div>
		<div>
			<div class="box" style="aspect-ratio: 1 / 1"></div>
			<p>Your code samples automatically saved in the cloud</p>
		</div>
	</div>
</div>

<div class="Section">
	<h2>Go create!</h2>
	<Button target="_blank" href="https://www.figma.com/community/plugin/1215620774867583125/figlet"
		>Try now</Button>
</div>

<style>
	.Nav {
		border-bottom: 1px solid var(--border-color-tertiary);
		padding: var(--size-2) var(--size-0);

		max-width: none !important;
		width: 100vw;
		box-sizing: border-box;
		position: relative;
		left: 50%;
		transform: translate(-50vw);
	}

	.Nav p {
		color: #000;
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
		padding: var(--size-00) var(--size-6);
		justify-content: center;
		align-items: center;
		gap: var(--size-00);
		flex-shrink: 0;
	}

	.Hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-block: var(--size-8);
		min-height: 400px;
		justify-content: center;
	}

	.Hero h1 {
		color: #000;
		text-align: center;
		font-size: var(--font-size-6);
		font-style: normal;
		font-weight: 500;
		line-height: 125%; /* 60px */
		letter-spacing: -1.92px;
	}

	.Badge p {
		color: #000;
		font-size: var(--font-size-1);
		font-style: normal;
		font-weight: 700;
		line-height: 125%; /* 20px */
		letter-spacing: -0.64px;
	}

	.Features {
		display: flex;
		flex-direction: column;
		gap: var(--size-3);
		user-select: none;
	}

	@custom-media --lg-n-above (width >= 1024px);

	@media (--lg-n-above) {
		.Features {
			flex-direction: row;
		}
	}

	.Video {
		border-radius: 8px;
		background: rgba(66, 173, 0, 0.1);
		aspect-ratio: 16 / 9;
		margin-top: var(--size-2);
	}

	hr {
		border-color: rgba(0, 0, 0, 0.2);
	}

	.text-size-0123 {
		color: var(--display, #000);
		text-align: center;
		font-size: 32px;
		font-style: normal;
		font-weight: 600;
		line-height: 125%; /* 40px */
		letter-spacing: -1.28px;
	}

	.Section {
		padding: var(--size-15);
		padding-top: 400px;
		margin-top: -400px;

		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
