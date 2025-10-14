/**
 * Add command - delegates to create-plugma package
 */

import { spawn } from 'node:child_process';
import { AddCommandOptions } from '../utils/create-options.js';
import chalk from 'chalk';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

export async function add(options: AddCommandOptions): Promise<void> {
	// Build the arguments to pass to create-plugma add
	const args: string[] = ['add'];

	// Add integration as positional argument
	if (options.integration) {
		args.push(options.integration);
	}

	// Add options
	if (options.debug) {
		args.push('--debug');
	}

	// Determine which create-plugma to use (local in dev, npx in production)
	const currentDir = dirname(fileURLToPath(import.meta.url));
	const localCreatePlugmaPath = join(currentDir, '..', '..', '..', 'create-plugma', 'dist', 'create-plugma.js');

	let command: string;
	let commandArgs: string[];

	if (existsSync(localCreatePlugmaPath)) {
		// Use local version for development
		command = 'node';
		commandArgs = [localCreatePlugmaPath, ...args];
	} else {
		// Use npx for production
		command = 'npx';
		commandArgs = ['create-plugma', ...args];
	}

	// Execute create-plugma add
	return new Promise((resolve, reject) => {
		const child = spawn(command, commandArgs, {
			stdio: 'inherit',
			cwd: options.cwd || process.cwd(),
			shell: true,
			env: {
				...process.env,
				PLUGMA_DEVELOPING_LOCALLY: process.env.PLUGMA_DEVELOPING_LOCALLY || 'false',
			},
		});

		child.on('close', (code) => {
			if (code !== 0) {
				reject(new Error(`create-plugma add exited with code ${code}`));
			} else {
				resolve();
			}
		});

		child.on('error', (error) => {
			console.error(chalk.red(`Error running create-plugma add: ${error.message}`));
			reject(error);
		});
	});
}
