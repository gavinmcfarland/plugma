import chalk from 'chalk';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function showCreatePlugmaPrompt() {
	try {
		// Read version from versions.json (contains plugma package version)
		const currentDir = dirname(fileURLToPath(import.meta.url));
		const versionsJsonPath = join(currentDir, '..', '..', 'versions.json');
		const versions = JSON.parse(readFileSync(versionsJsonPath, 'utf-8'));
		const version = versions.plugma || '2.0.0';
		const DEVELOPING_LOCALLY = process.env.PLUGMA_DEVELOPING_LOCALLY === 'true';

		// Display prompt similar to plugma
		console.log(
			`\n${chalk.bgMagenta(' Plugma ')} ${chalk.grey(`v${version}${DEVELOPING_LOCALLY ? ' [development]' : ''}`)}\n`,
		);
	} catch (error) {
		// Fallback if versions.json can't be read
		console.log(`\n${chalk.bgMagenta(' Plugma ')}\n`);
	}
}
