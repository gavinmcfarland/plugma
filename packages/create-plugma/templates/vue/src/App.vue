<script>
import Icon from './components/Icon.vue';

export default {
	components: {
		Icon,
	}
};
</script>

<template>
	<div class="container">
		<div class="banner">
			<Icon :svg="'plugma'" :size="38" />
			<Icon :svg="'plus'" :size="24" />
			<img src="./assets/vue.svg" width="44" height="44" alt="Vue logo" />
		</div>

		<a href="https://plugma.dev/docs" target="_blank" class="button">Read the docs</a>
	</div>
</template>

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
