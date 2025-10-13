import chalk from 'chalk';
import { readPlugmaPackageJson } from './fs/read-json.js';

export async function showPlugmaPrompt() {
	const version = (await readPlugmaPackageJson()).version;
	const DEVELOPING_LOCALLY = process.env.PLUGMA_DEVELOPING_LOCALLY === 'true';

	// Match original formatting with chalk
	console.log(
		`\n${chalk.bgMagenta(' Plugma ')} ${chalk.grey(`v${version}${DEVELOPING_LOCALLY ? ' [development]' : ''}`)}\n`,
	);
}
