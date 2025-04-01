import { createInterface } from "node:readline";
import chalk from "chalk/index.js";
import { createClient } from "websocket-gateway/client";

class ConnectionMonitor {
	constructor() {
		// Clear screen on start
		console.clear();
		console.log(chalk.cyan.bold("📡 Starting Socket.IO Monitor...\n"));

		const socket = createClient({
			room: "monitor",
			port: 8080,
		});

		socket.on("connect", () => {
			console.log(chalk.green("✓ Connected to server\n"));
		});

		socket.on("ROOM_STATE", (rooms) => {
			// Clear console before each update
			console.clear();
			this.updateDisplay(rooms);
		});

		// Handle graceful shutdown
		const rl = createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		rl.on("SIGINT", () => {
			console.clear();
			process.exit(0);
		});
	}

	private updateDisplay(
		rooms: Record<string, Array<{ id: string; clientType: string }>>,
	) {
		// Client connections
		Object.entries(rooms).forEach(([type, clients]) => {
			const color =
				type === "browser"
					? "blue"
					: type === "figma"
						? "magenta"
						: "green";

			const icon =
				type === "test" ? "🧪" : type === "dev-server" ? "⚡" : "│";

			const displayType = type === "node" ? "dev-server" : type;

			console.log(
				chalk[color].bold(
					`${icon} ${displayType} clients: ${clients.length}`,
				),
			);
			clients.forEach((client) => {
				console.log(chalk[color](`  └─ ${client.id}`));
			});
			console.log();
		});

		console.log(chalk.dim("Press Ctrl+C to exit\n"));
	}
}

// Start the monitor
new ConnectionMonitor();
