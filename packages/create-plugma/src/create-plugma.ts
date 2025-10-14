#!/usr/bin/env node

/**
 * Create Plugma CLI
 * Standalone command for creating new Figma plugin/widget projects
 */

import { Command } from 'commander';
import { create } from './create.js';
import { createOptions } from './utils/create-options.js';

const program = new Command();

program
	.name('create-plugma')
	.description('Create a new Figma plugin or widget project')
	.argument('[name]', 'Project name')
	.option('--plugin', 'Create a plugin project')
	.option('--widget', 'Create a widget project')
	.option('--framework <framework>', 'UI framework to use (react, svelte, vue)')
	.option('--react', 'Use React framework')
	.option('--svelte', 'Use Svelte framework')
	.option('--vue', 'Use Vue framework')
	.option('--template <template>', 'Use a specific template')
	.option('--no-typescript', 'Use JavaScript instead of TypeScript')
	.option('--no-ui', 'Create a project without UI')
	.option('--no-add-ons', 'Skip add-ons installation')
	.option('--no-install', 'Skip dependency installation')
	.option('--debug', 'Enable debug mode')
	.action(async (name, options) => {
		try {
			const createOpts = createOptions(
				{
					...options,
					name,
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
	});

program.parse();
