<script lang="ts">
	import { onMount } from "svelte";
	import { createClient } from "plugma/client";
	import type { Socket } from "socket.io-client";
	import MessageList from "./components/MessageList.svelte";
	import RoomList from "./components/RoomList.svelte";
	import MessageInput from "./components/MessageInput.svelte";

	interface Message {
		timestamp: string;
		content: string;
		from?: string;
		to?: string;
	}

	interface Room {
		members: Array<{
			id: string;
			room: string;
		}>;
	}

	interface Rooms {
		[key: string]: Room["members"];
	}

	let clientId = "";
	let rooms: Rooms = {};
	let messageInput = "";
	let selectedRoom = "browser";
	let sentMessages: Message[] = [];
	let receivedMessages: Message[] = [];
	let socket: Socket;

	// Get client type from URL parameter
	const urlParams = new URLSearchParams(window.location.search);
	const room = urlParams.get("type") || "browser";
	const clientTitle = `${room.charAt(0).toUpperCase() + room.slice(1)} Client`;

	function createMessage(
		content: string,
		to?: string,
		from?: string,
	): Message {
		return {
			timestamp: new Date().toLocaleTimeString(),
			content,
			to,
			from,
		};
	}

	function setupSocketListeners(socket: Socket) {
		socket.on("connect", () => {
			clientId = `Connected as: ${socket.id} in room: ${room}`;
		});

		socket.on("FILE_CHANGED", (data) => {
			const changeData = data.content;
			socket.emit("FILE_CHANGE_COMPLETE", {
				room: "test",
				data: changeData,
			});

			sentMessages = [
				...sentMessages,
				createMessage(
					`File change notification sent to test-client: ${JSON.stringify(changeData)}`,
					"test",
				),
			];
		});

		socket.on("ROOM_STATE", (newRooms: Rooms) => {
			rooms = newRooms;
			console.log("Rooms:", rooms);
		});

		socket.on("SEND_MESSAGE", (data) => {
			const messageText =
				typeof data.content === "object"
					? JSON.stringify(data.content)
					: data.content;

			receivedMessages = [
				...receivedMessages,
				createMessage(messageText, undefined, data.from),
			];
		});
	}

	function sendMessage() {
		if (!messageInput || !socket) return;

		sentMessages = [
			...sentMessages,
			createMessage(messageInput, selectedRoom),
		];

		socket.emit("SEND_MESSAGE", {
			room: selectedRoom,
			content: messageInput,
		});

		messageInput = "";
	}

	onMount(() => {
		socket = createClient({
			room,
			port: 8080,
		});

		setupSocketListeners(socket);
	});
</script>

<main>
	<h1>{clientTitle}</h1>
	<div>{clientId}</div>

	<h2>Connected Clients</h2>
	<RoomList {rooms} />

	<div class="message-containers">
		<MessageList
			title="Sent Messages"
			messages={sentMessages}
			messageClass="sent-message"
		/>
		<MessageList
			title="Received Messages"
			messages={receivedMessages}
			messageClass="received-message"
		/>
	</div>

	<MessageInput bind:value={messageInput} bind:selectedRoom {sendMessage} />
</main>

<style>
	.message-containers {
		display: flex;
		gap: 20px;
	}
</style>
