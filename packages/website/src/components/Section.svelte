<script lang="ts">
	interface Props {
		children?: import('svelte').Snippet;
		[key: string]: any;
	}

	let { ...props }: Props = $props();
</script>

<div class="px-6 py-24 md:py-28 w-full justify-center items-center border-t {props.class}">
	{@render props.children?.()}
</div>
