<script lang="ts">
import { ref } from 'vue'
import Icon from './components/Icon.vue'
import Input from './components/Input.vue'
import Button from './components/Button.vue'

export default {
	components: {
		Icon,
		Input,
		Button
	},
	setup() {
		// Reactive state using Vue's ref
		const rectCount = ref(5)
		const nodeCount = ref(0)

		// Function to create rectangles
		function createRectangles(count) {
			parent.postMessage(
				{
					pluginMessage: {
						type: 'CREATE_RECTANGLES',
						count,
					},
				},
				'*',
			)
		}

		// Message listener to update node count
		window.onmessage = (event) => {
			const message = event.data.pluginMessage
			if (message.type === 'POST_NODE_COUNT') {
				nodeCount.value = message.count
			}
		}

		// Return reactive variables and methods to the template
		return {
			rectCount,
			nodeCount,
			createRectangles,
		}
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

		<div class="field create-rectangles">
			<Input v-model="rectCount" type="number" />
			<Button @click="createRectangles(rectCount)">Create Rectangles</Button>
		</div>

		<div class="field node-count">
			<span>{{ nodeCount }} nodes selected</span>
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

.node-count {
	font-size: 11px;
}

.field {
	display: flex;
	gap: var(--spacer-2);
	height: var(--spacer-5);
	align-items: center;
}

.create-rectangles .Input {
	width: 40px;
}
</style>