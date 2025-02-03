<script lang="ts">
	export let svg;
	export let color = "currentColor";
	export let opacity: number = 1;

	export let size: number = 24;
	$: sizePx = `${size}px`;
</script>

<div class="Icon">
	{#if svg === "horizontal-ellipsis"}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M5.5 13.5C6.32843 13.5 7 12.8284 7 12C7 11.1716 6.32843 10.5 5.5 10.5C4.67157 10.5 4 11.1716 4 12C4 12.8284 4.67157 13.5 5.5 13.5Z"
				fill={color}
			/>
			<path
				d="M11.5 13.5C12.3284 13.5 13 12.8284 13 12C13 11.1716 12.3284 10.5 11.5 10.5C10.6716 10.5 10 11.1716 10 12C10 12.8284 10.6716 13.5 11.5 13.5Z"
				fill={color}
			/>
			<path
				d="M17.5 13.5C18.3284 13.5 19 12.8284 19 12C19 11.1716 18.3284 10.5 17.5 10.5C16.6716 10.5 16 11.1716 16 12C16 12.8284 16.6716 13.5 17.5 13.5Z"
				fill={color}
			/>
		</svg>
	{/if}

	{#if svg === "socket-connected"}
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect x="7.5" y="9.5" width="9" height="5" rx="2.5" fill="#77C515" />
			<!-- <rect x="8" y="10" width="8" height="4" rx="2" stroke="black" stroke-opacity="0.2" /> -->
		</svg>
	{/if}

	{#if svg === "socket-disconnected"}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="8"
				y="10"
				width="8"
				height="4"
				rx="2"
				stroke={color}
				stroke-opacity="0.4"
				fill-opacity={opacity}
			/>
		</svg>
	{/if}
</div>

<style>
	.Icon {
		display: inline-block;
		vertical-align: middle;
	}

	svg {
		overflow: visible;
	}

	/* .spinner {
		animation: rotate 2s linear infinite;
	} */

	@keyframes rotate {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
