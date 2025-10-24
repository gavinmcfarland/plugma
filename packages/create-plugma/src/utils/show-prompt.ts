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
		let version = versions.plugma || '2.0.0';
		const DEVELOPING_LOCALLY = process.env.PLUGMA_DEVELOPING_LOCALLY === 'true';

		// Strip caret prefix if present (e.g., "^2.0.39" -> "2.0.39")
		if (typeof version === 'string' && version.startsWith('^')) {
			version = version.substring(1);
		}

		// If version is a link reference (e.g., "link:../../plugma"), read from the linked package
		if (typeof version === 'string' && version.startsWith('link:')) {
			try {
				const linkPath = version.replace('link:', '');
				// The link path is relative to the create-plugma directory
				const createPlugmaDir = join(currentDir, '..', '..');
				const resolvedLinkPath = join(createPlugmaDir, linkPath);
				const linkedPackagePath = join(resolvedLinkPath, 'package.json');

				const linkedPackage = JSON.parse(readFileSync(linkedPackagePath, 'utf-8'));
				version = linkedPackage.version || version;
			} catch (linkError) {
				// If we can't read the linked package, fall back to the link string
				console.warn('Could not read linked package version:', linkError);
			}
		}

		// Display prompt using note() to make it part of the flow
		await note(`[ Plugma ]{bg#883AE2} ${chalk.grey(`v${version}${DEVELOPING_LOCALLY ? ' [development]' : ''}`)}`);
	} catch (error) {
		// Fallback if versions.json can't be read
		await note(`${chalk.bgHex('#883AE2')(' Plugma ')}`);
	}
}
