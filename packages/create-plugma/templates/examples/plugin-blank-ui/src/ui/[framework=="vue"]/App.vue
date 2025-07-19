<script lang="ts">
import Icon from './components/Icon.vue'

export default {
	components: {
		Icon
	}
}
</script>

<template>
	<div class="container">
		<div class="banner">
			<Icon :svg="'plugma'" :size="38" />
			<Icon :svg="'plus'" :size="24" />
			<img src="./assets/vue.svg" width="44" height="44" alt="Vue logo" />
		</div>
	</div>
</template>

<style scoped>
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