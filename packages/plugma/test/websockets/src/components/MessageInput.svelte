<script lang="ts">
	export let value: string;
	export let selectedRoom: string;
	export let sendMessage: () => void;

	function handleKeypress(e: KeyboardEvent) {
		if (e.key === "Enter") {
			sendMessage();
		}
	}
</script>

<div class="input-container">
	<input
		type="text"
		id="messageInput"
		placeholder="Type a message"
		bind:value
		on:keypress={handleKeypress}
	/>
	<select bind:value={selectedRoom}>
		<option value="browser">Browser</option>
		<option value="figma">Figma</option>
	</select>
	<button on:click={sendMessage}>Send Message</button>
</div>

<style>
	.input-container {
		display: flex;
		gap: 10px;
		margin-top: 1rem;
	}
</style>
