import chalk from "chalk";
import { formatTime } from "../../scripts/utils.js";
import path from 'path';

export function logFileUpdates() {
	let alreadyRun = 0
	let root = '';
	return {
		name: 'log-file-updates',
		configResolved(config) {
			root = config.root; // Capture the root directory from the Vite config
		},
		// async buildStart() {
		// 	console.log("Starting Vite build...");
		// },
		// async handleHotUpdate({ file, timestamp }) {
		// 	console.log(`[vite] File updated: ${file} at ${new Date(timestamp).toLocaleTimeString()}`);
		// },
		async transform(code, id) {
			if (alreadyRun >= 2) {
				const relativePath = path.relative(root, id);

				console.log('\n'.repeat(process.stdout.rows - 2))

				process.stdout.write('\x1B[H')
				console.log(chalk.grey(formatTime()) + chalk.cyan(chalk.bold(' [vite]')) + chalk.green(' main built') + chalk.grey(` /${relativePath}`))
			}
			alreadyRun += 1
			return code;
		},
		// async closeBundle() {
		// 	console.log("Vite build completed.");
		// },
	};
}
