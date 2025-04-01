<script lang="ts">
	export let title: string;
	export let messages: Array<{
		timestamp: string;
		content: string;
		from?: string;
		to?: string;
	}>;
	export let messageClass: string;
</script>

<div class="message-section">
	<h2>{title}</h2>
	<div class="message-box">
		{#each messages as message}
			<div class={messageClass}>
				[{message.timestamp}]
				{#if message.to}To {message.to}:
				{/if}
				{#if message.from}From {message.from}:
				{/if}
				{message.content}
			</div>
		{/each}
	</div>
</div>

<style>
	.message-section {
		flex: 1;
	}

	.message-box {
		height: 200px;
		overflow-y: auto;
		border: 1px solid #ccc;
		padding: 10px;
		margin: 10px 0;
	}
</style>
