/**
 * Create command - delegates to create-plugma package
 */

import { spawn } from 'node:child_process';
import { CreateCommandOptions } from '../utils/create-options.js';
import chalk from 'chalk';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Delegate to create-plugma package
 */
export async function create(options: CreateCommandOptions): Promise<void> {
	// Build the arguments to pass to create-plugma
	const args: string[] = [];

	// Add positional arguments for type and framework
	if (options.plugin) {
		args.push('plugin');
	} else if (options.widget) {
		args.push('widget');
	}

	// Add framework as second positional argument
	if (options.react) {
		args.push('react');
	} else if (options.svelte) {
		args.push('svelte');
	} else if (options.vue) {
		args.push('vue');
	} else if (options.noUi) {
		args.push('no-ui');
	} else if (options.framework) {
		args.push(options.framework.toLowerCase());
	}

	// Add options
	if (options.name) {
		args.push('--name', options.name);
	}

	if (options.template) {
		args.push('--template', options.template);
	}

	if (options.noTypescript) {
		args.push('--no-typescript');
	}

	if (options.noAddOns) {
		args.push('--no-add-ons');
	}

	if (options.noInstall) {
		args.push('--no-install');
	}

	if (options.debug) {
		args.push('--debug');
	}

	// Skip showing prompt in create-plugma since plugma already showed it
	args.push('--skip-prompt');

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

	// Execute create-plugma
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
				reject(new Error(`create-plugma exited with code ${code}`));
			} else {
				resolve();
			}
		});

		child.on('error', (error) => {
			console.error(chalk.red(`Error running create-plugma: ${error.message}`));
			reject(error);
		});
	});
}
