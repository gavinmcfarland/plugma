import chalk from 'chalk';
import { note } from 'askeroo';

/**
 * Command type for success messages
 */
export type SuccessMessageCommand = 'create' | 'add';

/**
 * Unified interface for displaying success messages
 */
export interface SuccessMessageParams {
	command: SuccessMessageCommand;
	title: string;
	steps: string[];
	errorMessage?: string;
	hasNextSteps?: boolean;
}

/**
 * Formats and displays a success message with steps for both create and add commands
 */
export async function formatAndDisplaySuccessMessageWithSteps(params: SuccessMessageParams): Promise<void> {
	const { title, steps, errorMessage, hasNextSteps } = params;

	const messageLines: string[] = [title + '\n'];

	// Show error message after title if provided
	if (errorMessage) {
		messageLines.push(errorMessage);
		messageLines.push(''); // Add empty line for spacing
	}

	// Add all steps
	messageLines.push(...steps);
	messageLines.push('');

	// Add information about INTEGRATIONS.md file if it was created
	let formattedMessage = messageLines.join('\n');
	if (hasNextSteps) {
		formattedMessage += `\n${chalk.blue('See INTEGRATIONS.md on how to use them.')}`;
	}

	await note(formattedMessage);
}
