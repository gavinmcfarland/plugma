/**
 * Shared utility for parsing create command arguments
 */

import chalk from 'chalk';
import { Command } from 'commander';

export interface ParsedCreateArgs {
	plugin?: boolean;
	widget?: boolean;
	react?: boolean;
	svelte?: boolean;
	vue?: boolean;
	noUi?: boolean;
	framework?: string;
}

export interface CreateCommandConfig {
	debugDefault?: boolean;
	commandName?: string;
	onAction: (type: string | undefined, framework: string | undefined, options: any) => Promise<void>;
}

/**
 * Parse and validate type and framework arguments for create command
 */
export function parseCreateArgs(
	type: string | undefined,
	framework: string | undefined,
	existingOptions: any = {},
): ParsedCreateArgs {
	const enhancedOptions: ParsedCreateArgs = { ...existingOptions };

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

	return enhancedOptions;
}

/**
 * Get example help text for create command
 */
export function getCreateExamplesText(commandName: string = 'create-plugma'): string {
	return `
Examples:
  ${commandName} plugin react
  ${commandName} plugin no-ui
  ${commandName} widget svelte
  ${commandName} plugin react --name my-plugin
  ${commandName} plugin --template rectangle-creator
  ${commandName}
`;
}

/**
 * Define the create command with shared configuration
 * @param program - Commander program or command to attach to
 * @param config - Configuration for the create command
 * @param asSubcommand - If true, creates a 'create' subcommand; if false, configures the root program
 */
export function defineCreateCommand(
	program: Command,
	config: CreateCommandConfig,
	asSubcommand: boolean = true,
): Command {
	const { debugDefault = false, commandName = 'create-plugma', onAction } = config;

	const cmd = asSubcommand ? program.command('create') : program;

	return cmd
		.description('Create a new Figma plugin or widget project')
		.argument('[type]', 'Project type: plugin or widget')
		.argument('[framework]', 'UI framework: react, svelte, vue, or no-ui')
		.option('--name <name>', 'Project name')
		.option('--template <template>', 'Use a specific template')
		.option('--no-typescript', 'Use JavaScript instead of TypeScript')
		.option('--no-add-ons', 'Skip add-ons installation')
		.option('--no-install', 'Skip dependency installation')
		.option('--skip-prompt', 'Skip showing the Plugma prompt (used internally)')
		.option('-d, --debug', 'Enable debug mode', debugDefault)
		.action(onAction)
		.addHelpText('after', getCreateExamplesText(commandName));
}
