#!/usr/bin/env node

/**
 * Create Plugma CLI
 * Standalone command for creating new Figma plugin/widget projects
 */

import { Command } from 'commander';
import { create } from './create.js';
import { createOptions } from './utils/create-options.js';
import { parseCreateArgs, defineCreateCommand } from './utils/parse-create-args.js';
import { showCreatePlugmaPrompt } from './utils/show-prompt.js';

const program = new Command();

program.name('create-plugma');

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

program.parse();
