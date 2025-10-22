import chalk from 'chalk';
import { readJson } from '@plugma/shared';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PlugmaPackageJson } from '../core/types.js';

async function readPlugmaPackageJson(): Promise<PlugmaPackageJson> {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);
	return readJson<PlugmaPackageJson>(join(__dirname, '..', '..', 'package.json'));
}

export async function showPlugmaPrompt() {
	const version = (await readPlugmaPackageJson()).version;
	const DEVELOPING_LOCALLY = process.env.PLUGMA_DEVELOPING_LOCALLY === 'true';

	// Match original formatting with chalk
	console.log(
		`\n${chalk.bgMagenta(' Plugma ')} ${chalk.grey(`v${version}${DEVELOPING_LOCALLY ? ' [development]' : ''}`)}\n`,
	);
}
