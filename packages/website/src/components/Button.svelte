<script lang="ts">
	export let href: string | null = null;
	export let target: string | null = null;
</script>

{#if href}
	<a class="Button px-7 py-4 rounded-full {$$props.class}" {href} {target}
		><span class="text"><slot></slot></span></a
	>
{:else}
	<button class="Button px-7 py-4 rounded-full">
		<span class="text">
			<slot></slot>
		</span>
	</button>
{/if}

<style>
	.Button {
		--active: 0;
		--button-color: var(--color-bg-reverse);
		background-color: var(--button-color);
		color: var(--color-text-reverse);
		display: inline-block;
		font-weight: 500;

		/* background-image: linear-gradient(90deg, var(--color-success) 0%, var(--color-info) 120%); */

		box-shadow:
			inset 0 0.5px 2px 0 var(--button-color),
			inset 0 2px 2px hsl(0, 0%, 100%),
			inset 0 -1px 2px 0 hsl(0, 0%, 0%),
			0px 4px 6px -4px hsla(0 0% 0% / calc(1 - 0.5)),
			0 0 0 calc(var(--active, 0) * 0.375rem) hsl(260 97% 50% / 0.75);
	}

	.Button:hover {
		background-color: var(--color-bg-hover);
	}

	.Button .text {
		position: relative;
		z-index: 10;

		background-image: linear-gradient(
			90deg,
			hsla(0 0% 100% / 1) 0%,
			hsla(0 0% 100% / 0.4) 120%
		);
		background-clip: text;

		color: transparent;
	}

	@media (prefers-color-scheme: dark) {
		.Button .text {
			background-image: linear-gradient(
				152deg,
				hsla(0 0% 0% / 1) 0%,
				hsla(0 0% 0% / 0.4) 120%
			);
		}
	}
</style>
