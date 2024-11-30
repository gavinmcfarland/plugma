<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
	name: 'Button',
	props: {
		href: {
			default: null
		},
		target: {
			default: '_self'
		},
		style: {
			default: null
		},
		onclick: {
			default: null
		}
	}
})
</script>

<template>
	<component :is="href ? 'a' : 'button'" class="Button" :href="href" :target="target" :style="style"
		:onclick="onclick">
		<slot />
	</component>
</template>

<style scoped>
.Button {
	display: block;
	border-radius: 5px;
	border: 1px solid var(--figma-color-border);
	padding: 0 7px;
	line-height: 22px;
	text-decoration: none;
	color: var(--figma-color-text);
}
</style>
