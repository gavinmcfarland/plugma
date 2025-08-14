<script lang="ts">
	interface Props {
		svg: any;
		color?: string;
		opacity?: number;
		strokeWidth?: number;
		isAnimated?: boolean;
		size?: number;
	}

	let {
		svg,
		color = 'currentColor',
		opacity = 0.8,
		strokeWidth = 1.5,
		isAnimated = false,
		size = 16
	}: Props = $props();
	let sizePx = $derived(`${size}px`);
</script>

<span class="Icon">
	{#if svg === 'package'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 25 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M4.5 8V16L12.5 21L20.5 16V8"
				stroke={color}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M12.5 13V21"
				stroke={color}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M12.5 3L20.5 8L12.5 13L4.5 8L12.5 3Z"
				stroke={color}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M8.5 5.5L16.5 10.5"
				stroke={color}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
	{#if svg === 'copy'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M8 10C8 8.89543 8.89543 8 10 8H19C20.1046 8 21 8.89543 21 10V19C21 20.1046 20.1046 21 19 21H10C8.89543 21 8 20.1046 8 19V10Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
			/>
			<path
				d="M5.00049 16C4.47005 16 3.96135 15.7893 3.58627 15.4142C3.2112 15.0391 3.00049 14.5304 3.00049 14V5C3.00049 4.46957 3.2112 3.96086 3.58627 3.58579C3.96135 3.21071 4.47005 3 5.00049 3H14.0005C14.5309 3 15.0396 3.21071 15.4147 3.58579C15.7898 3.96086 16.0005 4.46957 16.0005 5"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
	{#if svg === 'menu'}
		<svg
			width={sizePx}
			height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M19.7292 12.3632H5.72925"
				stroke={color}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M19.7292 7.36321H5.72925"
				stroke={color}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M19.7292 17.3632H5.72925"
				stroke={color}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
	{#if svg === 'close'}
		<svg
			width={sizePx}
			height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M18.0001 6L6.00006 18"
				stroke={color}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M6.00006 6L18.0001 18"
				stroke={color}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
	{#if svg === 'github'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M12.9598 2.57223C7.43481 2.57223 2.95981 7.04973 2.95981 12.5722C2.95981 16.9914 5.82481 20.7389 9.79731 22.0597C10.2973 22.1539 10.4806 21.8447 10.4806 21.5789C10.4806 21.3414 10.4723 20.7122 10.4681 19.8789C7.68648 20.4822 7.09981 18.5372 7.09981 18.5372C6.64481 17.383 5.98731 17.0747 5.98731 17.0747C5.08148 16.4547 6.05731 16.4672 6.05731 16.4672C7.06148 16.5372 7.58898 17.4972 7.58898 17.4972C8.48064 19.0264 9.92981 18.5847 10.5015 18.3289C10.5915 17.6822 10.849 17.2414 11.1348 16.9914C8.91398 16.7414 6.57981 15.8814 6.57981 12.0497C6.57981 10.958 6.96731 10.0664 7.60898 9.3664C7.49648 9.1139 7.15898 8.09723 7.69648 6.71973C7.69648 6.71973 8.53398 6.4514 10.4465 7.74473C11.2465 7.52223 12.0965 7.41223 12.9465 7.40723C13.7965 7.41223 14.6465 7.52223 15.4465 7.74473C17.3465 6.4514 18.184 6.71973 18.184 6.71973C18.7215 8.09723 18.384 9.1139 18.284 9.3664C18.9215 10.0664 19.309 10.958 19.309 12.0497C19.309 15.8914 16.9715 16.7372 14.7465 16.983C15.0965 17.283 15.4215 17.8964 15.4215 18.833C15.4215 20.1714 15.409 21.2464 15.409 21.5714C15.409 21.8339 15.584 22.1464 16.0965 22.0464C20.0973 20.7347 22.9598 16.9847 22.9598 12.5722C22.9598 7.04973 18.4823 2.57223 12.9598 2.57223Z"
				fill={color}
			/>
		</svg>
	{/if}
	{#if svg === 'bolt'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M13.91 3.5H8.37221C8.1514 3.5 7.95674 3.64483 7.89329 3.85633L5.19329 12.8563C5.09705 13.1771 5.33727 13.5 5.67221 13.5H9.3598C9.68509 13.5 9.92377 13.8057 9.84487 14.1213L8.47813 19.5882C8.35235 20.0914 8.98133 20.4297 9.33178 20.0474L18.2322 10.3379C18.5261 10.0172 18.2986 9.5 17.8636 9.5H14.0904C13.7815 9.5 13.5464 9.22257 13.5972 8.9178L14.4032 4.0822C14.454 3.77743 14.2189 3.5 13.91 3.5Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="2.16568"
				stroke-linecap="round"
				stroke-linejoin="round"
				class:animated-path={isAnimated}
			/>
		</svg>
	{/if}
	{#if svg === 'window'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			class="animated-svg"
		>
			<path
				d="M20 4H4C3.44772 4 3 4.44772 3 5V19C3 19.5523 3.44772 20 4 20H20C20.5523 20 21 19.5523 21 19V5C21 4.44772 20.5523 4 20 4Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
				class:animated-path={isAnimated}
			/>
			<path
				d="M20 4H4C3.44772 4 3 4.44772 3 5V10H21V5C21 4.44772 20.5523 4 20 4Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
				class:animated-path={isAnimated}
			/>
			<path
				d="M6.19531 7H6.20731"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				class:animated-dot={isAnimated}
			/>
			<path
				d="M9.27979 7H9.29179"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				class:animated-dot={isAnimated}
			/>
		</svg>
	{/if}
	{#if svg === 'screen-control'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M21 13.0128V4C21 3.44772 20.5523 3 20 3H4C3.44772 3 3 3.44772 3 4V16C3 16.5523 3.44772 17 4 17H5.7H12"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M14.7458 11.7955L16.1154 20.9612L17.8812 17.2263L21.9987 17.5645L14.7458 11.7955Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
	{#if svg === 'bug'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M12 7V21"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M3 13H6"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M18 13H21"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M9 6.99988V6C9 4.34315 10.3431 3 12 3C13.6569 3 15 4.34315 15 6V6.99988"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M6 9C4.34315 9 3 7.65685 3 6"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M18 9C19.6569 9 21 7.65685 21 6"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M6 17C4.34315 17 3 18.3431 3 20"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M18 17C19.6569 17 21 18.3431 21 20"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M14 7H10C7.79086 7 6 8.79086 6 11V15C6 18.3137 8.68629 21 12 21C15.3137 21 18 18.3137 18 15V11C18 8.79086 16.2091 7 14 7Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
	{#if svg === 'layout'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M20.546 4.63281H4.54605C3.99377 4.63281 3.54605 5.08053 3.54605 5.63281V19.6328C3.54605 20.1851 3.99377 20.6328 4.54605 20.6328H20.546C21.0983 20.6328 21.546 20.1851 21.546 19.6328V5.63281C21.546 5.08053 21.0983 4.63281 20.546 4.63281Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M20.546 4.63281H4.54605C3.99377 4.63281 3.54605 5.08053 3.54605 5.63281V10.6328H21.546V5.63281C21.546 5.08053 21.0983 4.63281 20.546 4.63281Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M9.54605 10.6328H3.54605V19.6328C3.54605 20.1851 3.99377 20.6328 4.54605 20.6328H9.54605V10.6328Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
	{#if svg === 'globe'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M12.9252 21.5336C17.8958 21.5336 21.9252 17.5042 21.9252 12.5336C21.9252 7.56304 17.8958 3.5336 12.9252 3.5336C7.95468 3.5336 3.92525 7.56304 3.92525 12.5336C3.92525 17.5042 7.95468 21.5336 12.9252 21.5336Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
			/>
			<path
				d="M12.9252 21.5336C15.1344 21.5336 16.9252 17.5042 16.9252 12.5336C16.9252 7.56304 15.1344 3.5336 12.9252 3.5336C10.7161 3.5336 8.92525 7.56304 8.92525 12.5336C8.92525 17.5042 10.7161 21.5336 12.9252 21.5336Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
			/>
			<path
				d="M3.92525 12.5336H21.9252"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
			/>
		</svg>
	{/if}
	{#if svg === 'cloud-upload-alt'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M16.9789 16.6508L12.9789 12.6508L8.97892 16.6508"
				stroke={color}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M12.9792 21.6508V12.6508"
				stroke={color}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M21.0492 18.6508C21.8391 18.084 22.4314 17.2752 22.7403 16.3417C23.0491 15.4081 23.0584 14.3984 22.7667 13.4592C22.4751 12.5199 21.8977 11.6999 21.1183 11.1181C20.339 10.5364 19.3982 10.2232 18.4326 10.2239H17.2878C17.0145 9.13731 16.5032 8.12809 15.7924 7.27227C15.0816 6.41645 14.1897 5.73631 13.184 5.28307C12.1783 4.82983 11.0849 4.61529 9.98619 4.65561C8.88745 4.69593 7.81198 4.99005 6.84077 5.51583C5.86955 6.04161 5.0279 6.78535 4.37916 7.69107C3.73041 8.59678 3.29148 9.64085 3.09542 10.7447C2.89936 11.8485 2.95129 12.9834 3.24727 14.0638C3.54325 15.1442 4.07558 16.142 4.80419 16.9821"
				stroke={color}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
	{#if svg === 'apps'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M9.54605 4.63287H4.54605C3.99376 4.63287 3.54605 5.08059 3.54605 5.63287V10.6329C3.54605 11.1852 3.99376 11.6329 4.54605 11.6329H9.54605C10.0983 11.6329 10.546 11.1852 10.546 10.6329V5.63287C10.546 5.08059 10.0983 4.63287 9.54605 4.63287Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
			/>
			<path
				d="M9.54605 14.6329H4.54605C3.99376 14.6329 3.54605 15.0806 3.54605 15.6329V20.6329C3.54605 21.1852 3.99376 21.6329 4.54605 21.6329H9.54605C10.0983 21.6329 10.546 21.1852 10.546 20.6329V15.6329C10.546 15.0806 10.0983 14.6329 9.54605 14.6329Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
			/>
			<path
				d="M19.546 14.6329H14.546C13.9938 14.6329 13.546 15.0806 13.546 15.6329V20.6329C13.546 21.1852 13.9938 21.6329 14.546 21.6329H19.546C20.0983 21.6329 20.546 21.1852 20.546 20.6329V15.6329C20.546 15.0806 20.0983 14.6329 19.546 14.6329Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
			/>
			<path
				d="M17.3389 2.89023L13.8034 6.42577C13.4128 6.81629 13.4128 7.44946 13.8034 7.83998L17.3389 11.3755C17.7294 11.766 18.3626 11.766 18.7531 11.3755L22.2886 7.83998C22.6792 7.44946 22.6792 6.81629 22.2886 6.42577L18.7531 2.89023C18.3626 2.49971 17.7294 2.49971 17.3389 2.89023Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
			/>
		</svg>
	{/if}
	{#if svg === 'clipboard-check'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M9 13.5L11 15.5L15 11.5"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M8 4H6C5.44772 4 5 4.44772 5 5V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V5C19 4.44772 18.5523 4 18 4H16"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
			/>
			<path
				d="M9 5V3C9 2.44772 9.44772 2 10 2H14C14.5523 2 15 2.44772 15 3V5C15 5.55228 14.5523 6 14 6H10C9.44772 6 9 5.55228 9 5Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
			/>
		</svg>
	{/if}
	{#if svg === 'boolean-subtract'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M9 16.25C12.7279 16.25 15.75 13.2279 15.75 9.5C15.75 5.77208 12.7279 2.75 9 2.75C5.27208 2.75 2.25 5.77208 2.25 9.5C2.25 13.2279 5.27208 16.25 9 16.25Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M15.7125 8.78751C16.9796 8.92206 18.1828 9.41254 19.1829 10.2022C20.1829 10.9919 20.9391 12.0486 21.3638 13.25C21.7885 14.4514 21.8645 15.7485 21.5829 16.9912C21.3013 18.234 20.6738 19.3717 19.7727 20.2727C18.8717 21.1738 17.734 21.8014 16.4912 22.0829C15.2484 22.3645 13.9513 22.2885 12.7499 21.8638C11.5485 21.4391 10.4919 20.683 9.7022 19.6829C8.91251 18.6828 8.42203 17.4797 8.28748 16.2125"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M15.4603 11.4603L21.4603 17.4603"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M13.7728 14.2728L19.7728 20.2728"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M10.9603 15.9603L16.9603 21.9603"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
	{#if svg === 'folder'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M3.00002 6.5C3.00002 5.94772 3.44773 5.5 4.00002 5.5H9.00002L11 7.5H20C20.5523 7.5 21 7.94772 21 8.5V18.5C21 19.0523 20.5523 19.5 20 19.5H4.00002C3.44773 19.5 3.00002 19.0523 3.00002 18.5V6.5Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
	{#if svg === 'terminal-filled'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M2 6C2 3.79086 3.79086 2 6 2H18C20.2091 2 22 3.79086 22 6V18C22 20.2091 20.2091 22 18 22H6C3.79086 22 2 20.2091 2 18V6ZM12 16C12 15.4477 12.4477 15 13 15H17C17.5523 15 18 15.4477 18 16C18 16.5523 17.5523 17 17 17H13C12.4477 17 12 16.5523 12 16ZM7.70711 7.29289C7.31658 6.90237 6.68342 6.90237 6.29289 7.29289C5.90237 7.68342 5.90237 8.31658 6.29289 8.70711L9.58579 12L6.29289 15.2929C5.90237 15.6834 5.90237 16.3166 6.29289 16.7071C6.68342 17.0976 7.31658 17.0976 7.70711 16.7071L11.7071 12.7071C12.0976 12.3166 12.0976 11.6834 11.7071 11.2929L7.70711 7.29289Z"
				fill={color}
				fill-opacity={opacity}
			/>
		</svg>
	{/if}
	{#if svg === 'terminal'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M3 6C3 4.34315 4.34315 3 6 3H18C19.6569 3 21 4.34315 21 6V18C21 19.6569 19.6569 21 18 21H6C4.34315 21 3 19.6569 3 18V6Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M13 16H17"
				stroke="black"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M7 8L11 12L7 16"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}

	{#if svg === 'plug-filled'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M6 2C3.79086 2 2 3.79086 2 6V18C2 20.2091 3.79086 22 6 22H18C20.2091 22 22 20.2091 22 18V6C22 3.79086 20.2091 2 18 2H6ZM6 14H9C9.55228 14 10 14.4477 10 15V16C10 16.5523 9.55228 17 9 17H6C5.44772 17 5 16.5523 5 16V15C5 14.4477 5.44772 14 6 14ZM18 14H15C14.4477 14 14 14.4477 14 15V16C14 16.5523 14.4477 17 15 17H18C18.5523 17 19 16.5523 19 16V15C19 14.4477 18.5523 14 18 14ZM11.5 6H12.5C13.0523 6 13.5 6.44772 13.5 7V10C13.5 10.5523 13.0523 11 12.5 11H11.5C10.9477 11 10.5 10.5523 10.5 10V7C10.5 6.44772 10.9477 6 11.5 6Z"
				fill={color}
			/>
		</svg>
	{/if}

	{#if svg === 'vite-logo'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 22"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M8.5 3.52027L2.12837 2.38281C1.68044 2.30284 1.34242 2.78104 1.56784 3.17583L11.6367 20.8106C11.8436 21.1729 12.3673 21.1707 12.5711 20.8067L22.4442 3.17413C22.6656 2.77857 22.326 2.30407 21.8796 2.38534L17.7837 3.13094"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				class:animated-path={isAnimated}
			/>
			<path
				d="M15.4748 1.73764L10.6102 2.70868C10.5302 2.72464 10.4711 2.79366 10.4662 2.8765L10.167 9.02499C10.16 9.14626 10.2693 9.24038 10.3855 9.21308L11.7398 8.89467C11.8665 8.8649 11.981 8.97859 11.955 9.10841L11.5526 11.1157C11.5255 11.2508 11.65 11.3663 11.7795 11.3262L12.6161 11.0673C12.7457 11.0272 12.8704 11.143 12.8429 11.2783L12.2035 14.4312C12.1635 14.6284 12.421 14.736 12.5284 14.5669L12.6001 14.454L16.564 6.3952C16.6304 6.26027 16.5159 6.10641 16.3704 6.13501L14.9764 6.40911C14.8453 6.43484 14.7339 6.31055 14.7709 6.17998L15.6808 1.96666C15.7178 1.83586 15.6059 1.71147 15.4748 1.73764Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				class:animated-path={isAnimated}
			/>
		</svg>
	{/if}

	{#if svg === 'arrow-left'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M5 12H19"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M11 18L5 12L11 6"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}

	{#if svg === 'arrow-right'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M19 12H5"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M13 6L19 12L13 18"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}

	{#if svg === 'check'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M4 12L9.33333 18L20 6"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
				class:animated-path={isAnimated}
			/>
		</svg>
	{/if}

	{#if svg === 'message-square'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}

	{#if svg === 'file'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M5 4C5 3.44772 5.44772 3 6 3H14L19 8V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V4Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M13 3V9H19"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}

	{#if svg === 'briefcase'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M19.2 7H4.8C3.80589 7 3 7.89543 3 9V19C3 20.1046 3.80589 21 4.8 21H19.2C20.1941 21 21 20.1046 21 19V9C21 7.89543 20.1941 7 19.2 7Z"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46956 3 8.96086 3.21071 8.58578 3.58579C8.21071 3.96086 8 4.46957 8 5V21"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}

	{#if svg === 'switch-alt'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M5 7H19"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M5 17H19"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M9 3L5 7L9 11"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M15 21L19 17L15 13"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}

	{#if svg === 'link-alt'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M17.2 6C17.7 6 18.2 6.1 18.7 6.3C19.2 6.5 19.6 6.8 20 7.2C20.4 7.6 20.7 8 20.9 8.5C21.1 9 21.2 9.5 21.2 10C21.2 10.5 21.1 11 20.9 11.5C20.7 12 20.4 12.4 20 12.8L19 13.9L17.9 15L16.9 16L15.8 17.1C15.4 17.5 15 17.8 14.5 18C14 18.2 13.5 18.3 13 18.3C12.5 18.3 12 18.2 11.5 18C11 17.8 10.6 17.5 10.2 17.1C9.8 16.7 9.5 16.3 9.3 15.8C9.1 15.3 9 14.8 9 14.2C9 13.7 9.1 13.2 9.3 12.7C9.5 12.2 9.8 11.8 10.2 11.4L11.3 10.3"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M7 18.9C6.5 18.9 6 18.8 5.5 18.6C5 18.4 4.6 18.1 4.2 17.7C3.8 17.3 3.5 16.9 3.3 16.4C3.1 15.9 3 15.4 3 14.9C3 14.4 3.1 13.9 3.3 13.4C3.5 12.9 3.8 12.5 4.2 12.1L5.2 11L6.3 9.9L7.4 8.8L8.5 7.7C8.9 7.3 9.3 7 9.8 6.8C10.3 6.6 10.8 6.5 11.3 6.5C11.8 6.5 12.3 6.6 12.8 6.8C13.3 7 13.7 7.3 14.1 7.7C14.5 8.1 14.8 8.5 15 9C15.2 9.5 15.3 10 15.3 10.5C15.3 11 15.2 11.5 15 12C14.8 12.5 14.5 12.9 14.1 13.3L13 14.5"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}

	{#if svg === 'link'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M13.2505 16.7495L11.0005 18.9995C9.3436 20.6563 6.65731 20.6563 5.00046 18.9995C3.3436 17.3426 3.3436 14.6563 5.00045 12.9995L7.25045 10.7495M16.7505 13.2495L19.0005 10.9995C20.6573 9.34262 20.6573 6.65633 19.0005 4.99947C17.3436 3.34262 14.6573 3.34262 13.0005 4.99948L10.7505 7.24948"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M9 15L15 9"
				stroke={color}
				stroke-opacity={opacity}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}

	{#if svg === 'carret-right-fill'}
		<svg
			style:width={sizePx}
			style:height={sizePx}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M10 8.06736C10 7.64344 10.4944 7.41186 10.8201 7.68325L15.5391 11.6157C15.7789 11.8156 15.7789 12.184 15.5391 12.3839L10.8201 16.3164C10.4944 16.5878 10 16.3562 10 15.9323V8.06736Z"
				fill={color}
				fill-opacity={opacity}
			/>
		</svg>
	{/if}
</span>

<style>
	svg {
		display: inline-block;
	}
	.Icon {
		display: inline-flex;
	}

	/* svg {
		overflow: visible;
	} */
	.animated-path {
		stroke-dasharray: 1000; /* Ensures the path is longer than any of the SVGs' lengths */
		stroke-dashoffset: 1000;
		animation: dash-animation 2s ease-in-out forwards;
		/* animation-delay: 0.5s; */
	}

	.animated-dot {
		opacity: 0;
		animation: fade-in 0.5s ease-in-out forwards;
		/* animation-delay: 0.5s; */
	}

	@keyframes dash-animation {
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes fade-in {
		to {
			opacity: 1;
		}
	}
</style>
