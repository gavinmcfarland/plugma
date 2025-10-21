#!/usr/bin/env node

/**
 * Create Plugma CLI
 * Standalone command for creating new Figma plugin/widget projects
 */

import { Command } from 'commander';
import { create } from './create.js';
import { add } from './add.js';
import { createOptions } from './utils/create-options.js';
import { parseCreateArgs, defineCreateCommand } from './utils/parse-create-args.js';
import { parseAddArgs, defineAddCommand } from './utils/parse-add-args.js';
import { showCreatePlugmaPrompt } from './utils/show-prompt.js';

const program = new Command();

program.name('create-plugma').description('Create Figma plugins and widgets, and manage integrations');

// Create command (as subcommand)
defineCreateCommand(
	program,
	{
		commandName: 'create-plugma create',
		onAction: async (type, framework, options) => {
			try {
				// Parse and validate arguments using shared utility
				const enhancedOptions = parseCreateArgs(type, framework, options);

				const createOpts = createOptions(
					{
						...enhancedOptions,
						cwd: process.cwd(),
					},
					{
						command: 'create',
					},
				);

				await create(createOpts);
			} catch (error) {
				console.error('Error:', error instanceof Error ? error.message : String(error));
				process.exit(1);
			}
		},
	},
	true, // Use as subcommand
);

// Add command (subcommand)
defineAddCommand(
	program,
	{
		commandName: 'create-plugma add',
		onAction: async (integration, options) => {
			try {
				// Show Create Plugma prompt

				// Parse and validate arguments using shared utility
				const enhancedOptions = parseAddArgs(integration, options);

				const addOpts = createOptions(
					{
						...enhancedOptions,
						cwd: process.cwd(),
					},
					{
						command: 'add',
					},
				);

				await add(addOpts);
			} catch (error) {
				console.error('Error:', error instanceof Error ? error.message : String(error));
				process.exit(1);
			}
		},
	},
	true, // Use as subcommand
);

// Auto-insert 'create' command when no subcommand is specified
// This allows 'create-plugma plugin react' to work as 'create-plugma create plugin react'
// And 'create-plugma' with no args to start the interactive create flow
const args = process.argv.slice(2); // Get args after 'node' and script path
const knownCommands = ['create', 'add', 'help'];
const helpFlags = ['-h', '--help', '-V', '--version'];

// Check if we should auto-insert 'create':
// 1. No arguments at all, OR
// 2. First arg is not a known command and not a help/version flag
const shouldInsertCreate = args.length === 0 || (!knownCommands.includes(args[0]) && !helpFlags.includes(args[0]));

if (shouldInsertCreate) {
	// Insert 'create' as the first argument
	process.argv.splice(2, 0, 'create');
}

program.parse(process.argv);
