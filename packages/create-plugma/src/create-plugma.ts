#!/usr/bin/env node

/**
 * Create Plugma CLI
 * Standalone command for creating new Figma plugin/widget projects
 */

import { Command } from 'commander';
import { create } from './create.js';
import { createOptions } from './utils/create-options.js';
import chalk from 'chalk';

const program = new Command();

program
	.name('create-plugma')
	.description('Create a new Figma plugin or widget project')
	.argument('[type]', 'Project type: plugin or widget')
	.argument('[framework]', 'UI framework: react, svelte, vue, or no-ui')
	.option('--name <name>', 'Project name')
	.option('--template <template>', 'Use a specific template')
	.option('--no-typescript', 'Use JavaScript instead of TypeScript')
	.option('--no-add-ons', 'Skip add-ons installation')
	.option('--no-install', 'Skip dependency installation')
	.option('--debug', 'Enable debug mode')
	.action(async (type, framework, options) => {
		try {
			// Convert positional arguments to options format
			const enhancedOptions = { ...options };

			// Handle type argument
			if (type) {
				const normalizedType = type.toLowerCase();
				if (normalizedType === 'plugin') {
					enhancedOptions.plugin = true;
				} else if (normalizedType === 'widget') {
					enhancedOptions.widget = true;
				} else {
					console.error(chalk.red(`Invalid project type: "${type}". Expected "plugin" or "widget".`));
					process.exit(1);
				}
			}

			// Handle framework argument
			if (framework) {
				const normalizedFramework = framework.toLowerCase();
				if (normalizedFramework === 'react') {
					enhancedOptions.react = true;
					enhancedOptions.framework = 'React';
				} else if (normalizedFramework === 'svelte') {
					enhancedOptions.svelte = true;
					enhancedOptions.framework = 'Svelte';
				} else if (normalizedFramework === 'vue') {
					enhancedOptions.vue = true;
					enhancedOptions.framework = 'Vue';
				} else if (normalizedFramework === 'no-ui') {
					enhancedOptions.noUi = true;
				} else {
					console.error(
						chalk.red(`Invalid framework: "${framework}". Expected "react", "svelte", "vue", or "no-ui".`),
					);
					process.exit(1);
				}
			}

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
	})
	.addHelpText(
		'after',
		`
Examples:
  create-plugma plugin react
  create-plugma plugin no-ui
  create-plugma widget svelte
  create-plugma plugin react --name my-plugin
  create-plugma plugin --template rectangle-creator
  create-plugma
`,
	);

program.parse();
