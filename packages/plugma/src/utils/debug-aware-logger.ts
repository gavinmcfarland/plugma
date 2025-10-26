import { ListrLogger, ListrLogLevels, ListrLoggerOptions } from 'listr2';
import { LISTR_LOGGER_STYLES } from '../constants.js';
import chalk from 'chalk';

export class DebugAwareLogger extends ListrLogger {
	constructor(
		private debug: boolean,
		options: Partial<ListrLoggerOptions<ListrLogLevels>> = {},
	) {
		super({
			useIcons: false,
			toStderr: [ListrLogLevels.COMPLETED, ListrLogLevels.FAILED],
			...LISTR_LOGGER_STYLES,
			...options,
		});
	}

	log(level: ListrLogLevels, message: any): void {
		if (!this.debug && (level === ListrLogLevels.OUTPUT || level === ListrLogLevels.SKIPPED)) {
			return; // Skip these levels when debug is false
		}
		super.log(level, message);
	}

	/**
	 * Logs a warning message with [WARNING] prefix
	 * @param message - The warning message to log
	 */
	warn(message: any): void {
		// Format the message with [WARNING] prefix and yellow color
		const formattedMessage = `${chalk.yellow('[WARNING]')} ${message}`;
		// Use console.warn to ensure it's always visible and goes to stderr
		console.warn(formattedMessage);
	}
}

export function createDebugAwareLogger(
	debug?: boolean,
	options?: Partial<ListrLoggerOptions<ListrLogLevels>>,
): DebugAwareLogger {
	return new DebugAwareLogger(debug ?? false, options);
}
