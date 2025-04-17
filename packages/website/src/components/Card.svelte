<script lang="ts">
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
	// No need for a `content` prop anymore; we will use the slot.
</script>

<div class="rounded-lg border p-6 pb-10 pt-8 space-y-2 flex flex-col place-items-center">
	{@render children?.()}
	<!-- Slot will render whatever is passed inside the component -->
</div>
