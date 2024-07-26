<script lang="ts">
	export let element = 'div';

	let allowedProps = [
		'width',
		'height',
		'display',
		'alignItems',
		'justifyContent',
		'background',
		'flexDirection',
		'gridColumn',
		'grid',
		'gridTemplateColumns',
		'border',
		'borderBottom',
		'borderLeft',
		'borderRight',
		'borderTop',
		'padding',
		'margin'
	];

	let props: { [key: string]: string } = {};

	// Override default props with any incoming props
	for (let key of allowedProps) {
		if ($$props[key]) {
			props[key] = $$props[key];
		}
	}

	// Convert camelCase to kebab-case
	const toKebabCase = (str: string) => {
		return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
	};

	// Create a style string from props with kebab-case conversion
	const createStyleString = (props: object) => {
		return Object.entries(props)
			.map(([key, value]) => `${toKebabCase(key)}: ${value};`)
			.join(' ');
	};

	$: style = createStyleString(props);
</script>

<svelte:element this={element} class="host margin-trim-block" {style}>
	<slot></slot>
</svelte:element>

<style>
	/* .host > *:first {
	margin-top:
} */
</style>
