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
	framework?: string;
	verbose?: boolean;
	addOns?: string[];
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
			// If the first argument is not a valid type, check if it's a framework
			const normalizedFirstArg = normalizedType;
			if (normalizedFirstArg === 'react') {
				enhancedOptions.react = true;
				enhancedOptions.framework = 'React';
			} else if (normalizedFirstArg === 'svelte') {
				enhancedOptions.svelte = true;
				enhancedOptions.framework = 'Svelte';
			} else if (normalizedFirstArg === 'vue') {
				enhancedOptions.vue = true;
				enhancedOptions.framework = 'Vue';
			} else {
				console.error(
					chalk.red(`Invalid argument: "${type}". Expected "plugin", "widget", "react", "svelte", or "vue".`),
				);
				process.exit(1);
			}
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
		} else {
			console.error(chalk.red(`Invalid framework: "${framework}". Expected "react", "svelte", or "vue".`));
			process.exit(1);
		}
	}

	return enhancedOptions;
}

/**
 * Get example help text for create command
 */
export function getCreateExamplesText(commandName: string = 'create-plugma'): string {
	// Remove 'create' from command name if present for cleaner examples
	const baseCommand = commandName.replace(' create', '');

	return `
Examples:
  ${baseCommand} plugin react
  ${baseCommand} widget svelte
  ${baseCommand} react
  ${baseCommand} svelte
  ${baseCommand} plugin react --name my-plugin
  ${baseCommand} plugin --template rectangle-creator
  ${baseCommand} plugin react --add tailwind shadcn vitest
  ${baseCommand} widget svelte --add prettier eslint
  ${baseCommand}
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

	// For subcommands, define the arguments in the command() call
	const cmd = asSubcommand ? program.command('create [type] [framework]') : program;

	return (
		asSubcommand
			? cmd
			: cmd
					.argument('[type]', 'Project type: plugin or widget (optional)')
					.argument('[framework]', 'UI framework: react, svelte, or vue (optional)')
	)
		.description('Create a new Figma plugin or widget project')
		.option('--dir <path>', 'Project directory name')
		.option('--template <name>', 'Use a specific template')
		.option('--no-ts', 'Use JavaScript instead of TypeScript')
		.option('--no-add', 'Skip add integrations')
		.option('--add <integrations...>', 'Add specific integrations (e.g., --add tailwind shadcn vitest)')
		.option(
			'--install [pkg-manager]',
			'Install dependencies using a specific package manager (npm, yarn, pnpm) or use detected package manager if none specified',
		)
		.option('--no-install', 'Skip dependency installation')
		.option('-y, --yes', 'Skip all prompts by accepting defaults')
		.option('-d, --debug', 'Enable debug mode', debugDefault)
		.option('--verbose', 'Show detailed integration subtasks')
		.action(onAction)
		.addHelpText('after', getCreateExamplesText(commandName));
}
