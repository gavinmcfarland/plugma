<script lang="ts">
	export let svg;
	export let color = 'currentColor';
	export let opacity: number = 0.8;
	export let strokeWidth: number = 1.5;

	export let size: number = 16;
	$: sizePx = `${size}px`;
</script>

<div class="Icon">
	{#if svg === 'folder'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg">
			<path
				d="M20.25 9.75V6.75C20.25 6.35218 20.092 5.97064 19.8107 5.68934C19.5294 5.40804 19.1478 5.25 18.75 5.25H8.25V3.75C8.25 3.35218 8.09196 2.97064 7.81066 2.68934C7.52936 2.40804 7.14782 2.25 6.75 2.25H2.25C1.85218 2.25 1.47064 2.40804 1.18934 2.68934C0.908035 2.97064 0.75 3.35218 0.75 3.75V20.05C0.755644 20.4585 0.908176 20.8512 1.17968 21.1564C1.45119 21.4616 1.82352 21.6589 2.22854 21.712C2.63355 21.7652 3.04418 21.6708 3.38527 21.446C3.72636 21.2212 3.97511 20.8812 4.086 20.488L6.437 10.831C6.52779 10.5189 6.71749 10.2448 6.97756 10.0498C7.23762 9.85484 7.55397 9.74963 7.879 9.75H21.75C21.9799 9.74992 22.2068 9.8027 22.4131 9.90426C22.6194 10.0058 22.7995 10.1535 22.9397 10.3357C23.0798 10.518 23.1762 10.7301 23.2213 10.9555C23.2665 11.181 23.2592 11.4138 23.2 11.636L21 20.636C20.9149 20.9555 20.7266 21.238 20.4644 21.4395C20.2021 21.641 19.8807 21.7501 19.55 21.75H2.447"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round" />
		</svg>
	{/if}

	{#if svg === 'folder-open'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg">
			<path
				d="M22.78 7.09999C22.78 6.01749 21.9025 5.13999 20.82 5.13999H9.06L7.6749 3.75359C7.3072 3.38609 6.8085 3.17979 6.2886 3.17999H3.18C2.0975 3.17999 1.22 4.05749 1.22 5.13999V18.86C1.22 19.9425 2.0975 20.82 3.18 20.82H20.82C21.9025 20.82 22.78 19.9425 22.78 18.86V7.09999Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round" />
		</svg>
	{/if}

	{#if svg === 'file'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg">
			<g clip-path="url(#clip0_391_8212)">
				<path
					d="M15 0.750002V5.036C15.0003 5.4905 15.1809 5.92631 15.5023 6.24769C15.8237 6.56907 16.2595 6.74974 16.714 6.75H21M4.636 0.750002C4.22039 0.732911 3.81492 0.881136 3.50832 1.16225C3.20172 1.44336 3.01895 1.83447 3 2.25V21.75C3.01895 22.1655 3.20172 22.5566 3.50832 22.8378C3.81492 23.1189 4.22039 23.2671 4.636 23.25H19.364C19.7796 23.2671 20.1851 23.1189 20.4917 22.8378C20.7983 22.5566 20.981 22.1655 21 21.75V5.871C20.9984 5.6707 20.9549 5.47294 20.8725 5.29041C20.79 5.10787 20.6703 4.94458 20.521 4.811L16.57 1.189C16.2524 0.903861 15.8398 0.747342 15.413 0.750002H4.636Z"
					stroke={color}
					stroke-opacity={opacity}
					stroke-width={strokeWidth}
					stroke-linecap="round"
					stroke-linejoin="round" />
			</g>
			<defs>
				<clipPath id="clip0_391_8212">
					<rect width="24" height="24" fill="white" />
				</clipPath>
			</defs>
		</svg>
	{/if}

	{#if svg === 'box'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg">
			<g clip-path="url(#clip0_474_5467)">
				<path
					d="M2.252 6.75101H21.752C21.752 6.75101 23.252 6.75101 23.252 8.25101V21.751C23.252 21.751 23.252 23.251 21.752 23.251H2.252C2.252 23.251 0.752001 23.251 0.752001 21.751V8.25101C0.752001 8.25101 0.752001 6.75101 2.252 6.75101Z"
					stroke={color}
					stroke-opacity={opacity}
					stroke-width={strokeWidth}
					stroke-linecap="round"
					stroke-linejoin="round" />
				<path
					d="M0.954 7.50001L3.354 1.64101C3.47212 1.37566 3.66474 1.1503 3.90846 0.992316C4.15219 0.834328 4.43655 0.750499 4.727 0.751009H19.277C19.5672 0.750973 19.8512 0.835131 20.0946 0.993281C20.3379 1.15143 20.5302 1.37678 20.648 1.64201L22.991 7.40701"
					stroke={color}
					stroke-opacity={opacity}
					stroke-width={strokeWidth}
					stroke-linecap="round"
					stroke-linejoin="round" />
				<path
					d="M12.002 6.75101V0.751007"
					stroke={color}
					stroke-opacity={opacity}
					stroke-width={strokeWidth}
					stroke-linecap="round"
					stroke-linejoin="round" />
			</g>
			<defs>
				<clipPath id="clip0_474_5467">
					<rect width="24" height="24" fill="white" />
				</clipPath>
			</defs>
		</svg>
	{/if}

	{#if svg === 'data-transfer-square'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg">
			<g clip-path="url(#clip0_474_5515)">
				<path
					d="M15.75 12.75L9.75 18.75"
					stroke={color}
					stroke-opacity={opacity}
					stroke-width={strokeWidth}
					stroke-linecap="round"
					stroke-linejoin="round" />
				<path
					d="M14.25 18.75H9.75V14.25"
					stroke={color}
					stroke-opacity={opacity}
					stroke-width={strokeWidth}
					stroke-linecap="round"
					stroke-linejoin="round" />
				<path
					d="M8.25 11.25L14.25 5.25"
					stroke={color}
					stroke-opacity={opacity}
					stroke-width={strokeWidth}
					stroke-linecap="round"
					stroke-linejoin="round" />
				<path
					d="M9.75 5.25H14.25V9.75"
					stroke={color}
					stroke-opacity={opacity}
					stroke-width={strokeWidth}
					stroke-linecap="round"
					stroke-linejoin="round" />
				<path
					d="M3.75 0.75H20.25C20.25 0.75 23.25 0.75 23.25 3.75V20.25C23.25 20.25 23.25 23.25 20.25 23.25H3.75C3.75 23.25 0.75 23.25 0.75 20.25V3.75C0.75 3.75 0.75 0.75 3.75 0.75Z"
					stroke={color}
					stroke-opacity={opacity}
					stroke-width={strokeWidth}
					stroke-linecap="round"
					stroke-linejoin="round" />
			</g>
			<defs>
				<clipPath id="clip0_474_5515">
					<rect width="24" height="24" fill="white" />
				</clipPath>
			</defs>
		</svg>
	{/if}

	{#if svg === 'vite-logo'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 22"
			fill="none"
			xmlns="http://www.w3.org/2000/svg">
			<path
				d="M8.5 3.52027L2.12837 2.38281C1.68044 2.30284 1.34242 2.78104 1.56784 3.17583L11.6367 20.8106C11.8436 21.1729 12.3673 21.1707 12.5711 20.8067L22.4442 3.17413C22.6656 2.77857 22.326 2.30407 21.8796 2.38534L17.7837 3.13094"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round" />
			<path
				d="M15.4748 1.73764L10.6102 2.70868C10.5302 2.72464 10.4711 2.79366 10.4662 2.8765L10.167 9.02499C10.16 9.14626 10.2693 9.24038 10.3855 9.21308L11.7398 8.89467C11.8665 8.8649 11.981 8.97859 11.955 9.10841L11.5526 11.1157C11.5255 11.2508 11.65 11.3663 11.7795 11.3262L12.6161 11.0673C12.7457 11.0272 12.8704 11.143 12.8429 11.2783L12.2035 14.4312C12.1635 14.6284 12.421 14.736 12.5284 14.5669L12.6001 14.454L16.564 6.3952C16.6304 6.26027 16.5159 6.10641 16.3704 6.13501L14.9764 6.40911C14.8453 6.43484 14.7339 6.31055 14.7709 6.17998L15.6808 1.96666C15.7178 1.83586 15.6059 1.71147 15.4748 1.73764Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth} />
		</svg>
	{/if}
</div>

<style>
	.Icon {
		display: table;
	}

	svg {
		overflow: visible;
	}
</style>
