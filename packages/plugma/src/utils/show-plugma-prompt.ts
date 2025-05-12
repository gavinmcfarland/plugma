import chalk from 'chalk'
import { readPlugmaPackageJson } from './fs/read-json.js'
import { Logger } from './log/logger.js'

export async function showPlugmaPrompt() {
	const log = new Logger()
	const version = (await readPlugmaPackageJson()).version
	const DEVELOPING_LOCALLY = process.env.PLUGMA_DEVELOPING_LOCALLY === 'true'

	// Match original formatting with chalk
	log.text(`${chalk.blue.bold('Plugma')} ${chalk.grey(`v${version}${DEVELOPING_LOCALLY ? ' [development]' : ''}`)}\n`)
}
