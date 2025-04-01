<script lang="ts">
	interface Room {
		members: Array<{
			id: string;
			room: string;
		}>;
	}

	interface Rooms {
		[key: string]: Room["members"];
	}

	export let rooms: Rooms;
</script>

<div id="rooms">
	{#each Object.entries(rooms) as [roomName, members]}
		<div class="room">
			<h3>{roomName} ({members.length})</h3>
			{#each members as member}
				<div class="member">{member.id} ({member.room})</div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.room {
		margin-bottom: 20px;
	}

	.member {
		margin: 5px 0;
	}
</style>
