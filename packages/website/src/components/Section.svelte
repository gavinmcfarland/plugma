<script lang="ts">
	interface Props {
		children?: import('svelte').Snippet;
		[key: string]: any
	}

	let { ...props }: Props = $props();
</script>

<div class="py-24 md:py-28 px-4 w-full justify-center items-center border-t {props.class}">
	{@render props.children?.()}
</div>
