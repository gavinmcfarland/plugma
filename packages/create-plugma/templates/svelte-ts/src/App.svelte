<script lang="ts">
	import svelteLogo from './assets/svelte.svg'
	import Icon from './components/Icon.svelte'
</script>

<div class="container">
	<div class="banner">
		<Icon svg="plugma" size={38} />

		<Icon svg="plus" size={24} />

		<img src={svelteLogo} width="44" height="44" alt="Svelte logo" />
	</div>

	<a href="https://plugma.dev/docs" target="_blank" class="button">Read the docs</a>
</div>

<style>
	.container {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		width: 100%;
	}
	.banner {
		display: flex;
		align-items: center;
		gap: 18px;
		margin-bottom: 24px;
	}

	.button {
		position: absolute;
		right: 16px;
		bottom: 16px;
		display: block;
		border-radius: 5px;
		border: 1px solid var(--figma-color-border);
		padding-inline: 8px;
		line-height: 22px;
		text-decoration: none;
		color: var(--figma-color-text);
	}
</style>
