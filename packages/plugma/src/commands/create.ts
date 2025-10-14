/**
 * Create command - delegates to create-plugma package
 */

import { spawn } from 'node:child_process';
import { CreateCommandOptions } from '../utils/create-options.js';
import chalk from 'chalk';

/**
 * Delegate to create-plugma package
 */
export async function create(options: CreateCommandOptions): Promise<void> {
	// Build the arguments to pass to create-plugma
	const args: string[] = [];

	if (options.name) {
		args.push(options.name);
	}

	if (options.plugin) {
		args.push('--plugin');
	}

	if (options.widget) {
		args.push('--widget');
	}

	if (options.framework) {
		args.push('--framework', options.framework);
	}

	if (options.react) {
		args.push('--react');
	}

	if (options.svelte) {
		args.push('--svelte');
	}

	if (options.vue) {
		args.push('--vue');
	}

	if (options.template) {
		args.push('--template', options.template);
	}

	if (options.noTypescript) {
		args.push('--no-typescript');
	}

	if (options.noUi) {
		args.push('--no-ui');
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

	// Execute create-plugma via npx
	return new Promise((resolve, reject) => {
		const child = spawn('npx', ['create-plugma', ...args], {
			stdio: 'inherit',
			cwd: options.cwd || process.cwd(),
			shell: true,
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
