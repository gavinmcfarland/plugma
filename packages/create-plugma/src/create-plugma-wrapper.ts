#!/usr/bin/env node

/**
 * Wrapper for create-plugma that redirects to the unified CLI
 * This maintains backward compatibility for `npm create plugma`
 */

import { spawn } from 'node:child_process';
import chalk from 'chalk';

// Function to show migration message
const showMigrationMessage = (): void => {
	console.log(`${(chalk.blue as any).bold('Create Plugma')} ${chalk.gray('v2.1.0')} \n`);
	console.log(chalk.yellow('📣 create-plugma has moved to the main plugma CLI!'));
	console.log(chalk.gray('   Use'), (chalk as any).cyan('npx plugma init'), chalk.gray('for the latest features.\n'));
	console.log(chalk.gray('Redirecting to npx plugma init...\n'));
};

async function main(): Promise<void> {
	showMigrationMessage();

	// Parse command line arguments (skip 'node' and script name)
	const args = process.argv.slice(2);

	// Spawn the new command
	const child = spawn('npx', ['plugma', 'init', ...args], {
		stdio: 'inherit',
		shell: true,
	});

	// Handle process exit
	child.on('exit', (code) => {
		process.exit(code || 0);
	});

	// Handle errors
	child.on('error', (error) => {
		console.error(chalk.red('Error running npx plugma init:'));
		console.error(error.message);
		console.log(chalk.yellow('\nTry installing plugma globally:'));
		console.log((chalk as any).cyan('npm install -g plugma'));
		process.exit(1);
	});
}

main().catch((error) => {
	console.error(chalk.red('Unexpected error:'), error);
	process.exit(1);
});
