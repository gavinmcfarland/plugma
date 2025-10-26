import { createClient } from "plugma/client";
import chalk from "chalk";

/**
 * Client class for testing connections to the development server
 */
export class TestClient {
	private socket = createClient({
		room: "test",
	});

	constructor() {
		console.clear();
		console.log(chalk.cyan("\n⚡ Starting Test Client...\n"));

		this.socket.on("connect", () => {
			console.log(
				chalk.green("✓ Connected to server as:"),
				chalk.yellow(this.socket.id),
				"\n",
			);
			this.runTests();
		});
	}

	private async runTests() {
		const tests = [
			"Connecting to WebSocket",
			"Testing room creation",
			"Verifying message delivery",
			"Checking client disconnect",
			"Validating room state",
		];

		for (const test of tests) {
			console.log(chalk.yellow("⠋"), chalk.white(`Running: ${test}`));

			// Simulate test execution
			await this.delay(1000 + Math.random() * 2000);

			// Random pass/fail (80% pass rate)
			if (Math.random() > 0.2) {
				console.log(chalk.green("✓"), chalk.dim(test));
			} else {
				console.log(chalk.red("✗"), chalk.dim(test));
				this.cleanup();
				return;
			}
		}

		console.log(chalk.green("\n✨ All tests passed!\n"));
		this.cleanup();
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private cleanup() {
		setTimeout(() => {
			console.log(chalk.yellow("👋 Disconnecting...\n"));
			this.socket.disconnect();
			process.exit(0);
		}, 1000);
	}
}

new TestClient();
