import { createClient } from "plugma/client";

import { watch } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";

/**
 * Watches for file changes in the specified directory and notifies connected Figma clients
 * @param client The Socket client instance used to broadcast messages
 */
function watchForFileChanges(client) {
	// Mock directory to watch - adjust this path as needed
	const watchDir = join(process.cwd());

	console.log(chalk.green("✓"), chalk.dim(`Watching directory: ${watchDir}`));

	watch(watchDir, { recursive: true }, (eventType, filename) => {
		console.log(chalk.green("✓"), chalk.dim(`File changed: ${filename}`));
		if (filename) {
			const payload = {
				timeStamp: new Date().toISOString(),
				file: filename,
				event: eventType,
				room: "figma",
			};
			console.log(
				chalk.blue("→"),
				chalk.dim(`Emitting FILE_CHANGED:`, payload),
			);
			client.emit("FILE_CHANGED", payload);
		}
	});
}

const devServer = createClient({
	room: "dev-server",
});

// Start watching for file changes
watchForFileChanges(devServer);
