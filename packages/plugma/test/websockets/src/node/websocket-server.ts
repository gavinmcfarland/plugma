import { roomStore } from "../shared/store.js";
import { createSocketServer } from "plugma/server";
import { httpServer } from "./http-server.js";

const PORT = process.env.PORT || 8080;

// Create Socket.IO server
const io = createSocketServer({ httpServer });

// Handle socket connections
io.on("connection", (socket) => {
	const room = socket.handshake.auth.room as string;
	console.log(`Client connected: ${socket.id} (${room})`);

	// socket.data.room = room;

	// Add to room store
	roomStore.addMember(room, {
		id: socket.id,
		room,
	});

	// Handle messages to specific client types
	socket.on("MESSAGE_TO_TYPE", ({ targetType, message }) => {
		console.log(`Message from ${room} to ${targetType}:`, message);
		io.to(targetType).emit("MESSAGE_FROM_TYPE", {
			room: room,
			message,
		});
	});

	// Handle disconnect
	socket.on("disconnect", () => {
		console.log(`Client disconnected: ${socket.id} (${room})`);
		roomStore.removeMember(room, socket.id);
		io.emit("ROOM_STATE", roomStore.getState());
	});

	// Broadcast updated room state
	const rooms = roomStore.getState();
	io.emit("ROOM_STATE", rooms);
});

httpServer.listen(PORT);

console.log(`Figma client: http://localhost:5173/?type=figma`);
console.log(`Browser client: http://localhost:5173/?type=browser`);
