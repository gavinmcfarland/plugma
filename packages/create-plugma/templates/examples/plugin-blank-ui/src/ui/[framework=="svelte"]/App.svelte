<script lang="ts">
	import svelteLogo from "./assets/svelte.svg";
	import Icon from "./components/Icon.svelte";
</script>

<div class="container">
	<div class="banner">
		<Icon svg="plugma" size={38} />

		<Icon svg="plus" size={24} />

		<img src={svelteLogo} width="44" height="44" alt="Svelte logo" />
	</div>
</div>

<style>
	.container {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		width: 100%;
		flex-direction: column;
	}
	.banner {
		display: flex;
		align-items: center;
		gap: 18px;
		margin-bottom: 16px;
	}
</style>
