const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Import UUID for unique client IDs

const PORT = 9001;

const app = express();

app.get('/', (req, res) => {
	res.sendFile(path.join(process.cwd() + '/dist/ui.html')); // Serve the main HTML page
});

// Initialize a simple HTTP server
const server = http.createServer(app);

// Initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

// Map to store clients with their unique IDs
const clients = new Map();


wss.on('connection', (ws) => {
	const clientId = uuidv4(); // Generate a unique ID for the client
	clients.set(clientId, ws); // Store the WebSocket connection with its unique ID

	// Log the new connection
	console.log(`New client connected: ${clientId}`);

	// Set up initial client state
	ws.isAlive = true;
	ws.clientId = clientId; // Assign clientId to ws object for easy access

	ws.on('pong', () => {
		ws.isAlive = true; // Update client status on pong response
	});

	// Handle incoming messages from this client
	ws.on('message', (message, isBinary) => {

		const textMessage = isBinary ? message : message.toString();

		// Here you can decide how to handle messages, such as broadcasting to other clients
		broadcastMessage(textMessage, clientId);
	});

	// // Optionally, send a welcome message or the client's ID
	// ws.send(JSON.stringify({ message: 'Connected to WebSocket server', clientId }));

	ws.on('close', () => {
		clients.delete(clientId); // Remove the client on disconnect
		console.log(`Client ${clientId} disconnected`);
	});
});

// Function to broadcast messages to clients except the sender
function broadcastMessage(message, senderId) {
	clients.forEach((client, clientId) => {

		if (clientId !== senderId && client.readyState === WebSocket.OPEN) {
			console.log(`--message from main ${new Date()}:`, message)
			client.send(JSON.stringify({ webSocketMessage: message, clientId }));
		}
	});
}

// Check connection status and send pings every 10 seconds
setInterval(() => {
	wss.clients.forEach(ws => {
		if (!ws.isAlive) {
			console.log(`Terminating connection ${ws.clientId}`);
			return ws.terminate();
		}
		ws.isAlive = false;
		ws.ping(); // Send ping to check if the connection is still alive
	});
}, 10000);

server.listen(PORT, () => {
	console.log(`Server is running at http://localhost:${PORT}`);
});
