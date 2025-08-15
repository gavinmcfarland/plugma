import chalk from 'chalk';

/**
 * Standalone warning function that formats messages with [WARNING] prefix
 * Can be used in contexts where the main logger isn't available (e.g., Vite plugins)
 * @param message - The warning message to log
 */
export function logWarning(message: string): void {
	const formattedMessage = `${chalk.yellow('[WARNING]')} ${message}`;
	console.warn(formattedMessage);
}

/**
 * Logs multiple warning messages with [WARNING] prefix
 * @param messages - Array of warning messages to log
 */
export function logWarnings(messages: string[]): void {
	messages.forEach((message) => logWarning(message));
}
