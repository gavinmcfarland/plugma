import cliSpinners from 'cli-spinners';
import chalk from 'chalk';
import boxen from 'boxen';

/**
 * Creates an animated spinner using cli-spinners
 * @param spinnerName - The name of the spinner to use (defaults to 'dots')
 */
export function createSpinner(spinnerName: keyof typeof cliSpinners = 'dots') {
	let interval: ReturnType<typeof setInterval> | null = null;
	let currentFrame = 0;
	let isSpinning = false;

	// Use the specified spinner from cli-spinners
	const spinner = cliSpinners[spinnerName];

	return {
		start(message: string) {
			if (isSpinning) return;

			isSpinning = true;
			currentFrame = 0;

			// Hide cursor
			process.stdout.write('\u001B[?25l');

			interval = setInterval(() => {
				const frame = spinner.frames[currentFrame];
				process.stdout.write(`\r${chalk.cyan(frame)} ${message}`);
				currentFrame = (currentFrame + 1) % spinner.frames.length;
			}, spinner.interval);
		},

		stop(message?: string) {
			if (!isSpinning || !interval) return;

			isSpinning = false;
			clearInterval(interval);
			interval = null;

			// Clear the line and show cursor
			process.stdout.write('\r\u001B[K');
			process.stdout.write('\u001B[?25h');

			// Show the completion message only if message is provided
			if (message && message.trim()) {
				console.log(chalk.green(`✓ ${message}`));
			}
		},

		fail(message: string) {
			if (!isSpinning || !interval) return;

			isSpinning = false;
			clearInterval(interval);
			interval = null;

			// Clear the line and show cursor
			process.stdout.write('\r\u001B[K');
			process.stdout.write('\u001B[?25h');

			// Show the error message
			console.log(chalk.red(`✗ ${message}`));
		},

		box(message?: string, options?: { type?: 'success' | 'error' | 'info' | 'warning'; title?: string }) {
			if (!isSpinning || !interval) return;

			isSpinning = false;
			clearInterval(interval);
			interval = null;

			// Clear the line and show cursor
			process.stdout.write('\r\u001B[K');
			process.stdout.write('\u001B[?25h');

			// Use the createBox function for consistency
			console.log(
				createBox(message, {
					type: options?.type || 'success',
					title: options?.title,
				}),
			);
		},
	};
}

/**
 * Creates a boxed message with rounded corners
 */
export function createBox(
	message?: string,
	options?: {
		type?: 'success' | 'error' | 'info' | 'warning';
		title?: string;
		padding?: number;
		margin?: number;
	},
) {
	const type = options?.type || 'success';
	let borderColor: string;
	let icon: string;
	let genericMessage: string;

	switch (type) {
		case 'success':
			borderColor = 'green';
			icon = '✓';
			genericMessage = 'Operation completed successfully!';
			break;
		case 'error':
			borderColor = 'red';
			icon = '✗';
			genericMessage = 'Operation failed!';
			break;
		case 'info':
			borderColor = 'blue';
			icon = 'ℹ';
			genericMessage = 'Information';
			break;
		case 'warning':
			borderColor = 'yellow';
			icon = '⚠';
			genericMessage = 'Warning';
			break;
	}

	// Use generic message if no custom message provided, otherwise use the provided message
	const displayMessage = message || genericMessage;
	const boxMessage = `${icon} ${displayMessage}`;

	return boxen(boxMessage, {
		padding: options?.padding ?? 1,
		margin: options?.margin ?? 1,
		borderStyle: 'round',
		borderColor,
		title: options?.title,
		titleAlignment: 'center',
	});
}

/**
 * Legacy spinner function for compatibility
 * @deprecated Use createSpinner() instead
 */
export function spinner() {
	return createSpinner();
}
