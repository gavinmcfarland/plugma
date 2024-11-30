<script lang="ts">
export default {
	name: 'Button',
	props: {
		href: {
			type: String,
			default: null,
		},
		target: {
			type: String,
			default: null,
		},
		style: {
			type: Object,
			default: () => ({}),
		},
		onClick: {
			type: Function,
			default: null,
		},
	},
	methods: {
		handleClick(event: any) {
			if (this.onClick) {
				this.onClick(event);
			}
		},
	},
};
</script>

<template>
	<div>
		<a v-if="href" :class="'Button'" :href="href" :target="target" :style="style" @click="handleClick">
			<slot />
		</a>
		<button v-else :class="'Button'" :style="style" @click="handleClick">
			<slot />
		</button>
	</div>
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
