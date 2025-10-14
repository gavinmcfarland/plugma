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

// Create command (root command)
defineCreateCommand(
	program,
	{
		commandName: 'create-plugma',
		onAction: async (type, framework, options) => {
			try {
				// Show Create Plugma prompt unless --skip-prompt is passed
				if (!options.skipPrompt) {
					showCreatePlugmaPrompt();
				}

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
	false, // Use as root command, not subcommand
);

// Add command (subcommand)
defineAddCommand(
	program,
	{
		commandName: 'create-plugma add',
		onAction: async (integration, options) => {
			try {
				// Show Create Plugma prompt
				showCreatePlugmaPrompt();

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

program.parse();
