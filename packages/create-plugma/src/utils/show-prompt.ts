import chalk from 'chalk';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { note } from 'askeroo';

export async function showCreatePlugmaPrompt() {
	try {
		// Read version from versions.json (contains plugma package version)
		const currentDir = dirname(fileURLToPath(import.meta.url));
		const versionsJsonPath = join(currentDir, '..', '..', 'versions.json');
		const versions = JSON.parse(readFileSync(versionsJsonPath, 'utf-8'));
		const version = versions.plugma || '2.0.0';
		const DEVELOPING_LOCALLY = process.env.PLUGMA_DEVELOPING_LOCALLY === 'true';

		// Display prompt using note() to make it part of the flow
		await note(
			`\n${chalk.bgMagenta(' Plugma ')} ${chalk.grey(`v${version}${DEVELOPING_LOCALLY ? ' [development]' : ''}`)}`,
		);
	} catch (error) {
		// Fallback if versions.json can't be read
		await note(`\n${chalk.bgMagenta(' Plugma ')}`);
	}
}
