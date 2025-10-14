/**
 * Shared utility for parsing add command arguments
 */

import { Command } from 'commander';

export interface ParsedAddArgs {
	integration?: string;
	debug?: boolean;
}

export interface AddCommandConfig {
	debugDefault?: boolean;
	commandName?: string;
	onAction: (integration: string | undefined, options: any) => Promise<void>;
}

/**
 * Parse and validate integration argument for add command
 */
export function parseAddArgs(integration: string | undefined, existingOptions: any = {}): ParsedAddArgs {
	const enhancedOptions: ParsedAddArgs = { ...existingOptions };

	// Handle integration argument
	if (integration) {
		enhancedOptions.integration = integration.toLowerCase();
	}

	return enhancedOptions;
}

/**
 * Get example help text for add command
 */
export function getAddExamplesText(commandName: string = 'create-plugma add'): string {
	return `
Examples:
  ${commandName}
  ${commandName} tailwind
  ${commandName} eslint
  ${commandName} playwright
  ${commandName} vitest
  ${commandName} shadcn
`;
}

/**
 * Define the add command with shared configuration
 * @param program - Commander program or command to attach to
 * @param config - Configuration for the add command
 * @param asSubcommand - If true, creates an 'add' subcommand; if false, configures the root program
 */
export function defineAddCommand(program: Command, config: AddCommandConfig, asSubcommand: boolean = true): Command {
	const { debugDefault = false, commandName = 'create-plugma add', onAction } = config;

	const cmd = asSubcommand ? program.command('add') : program;

	return cmd
		.description('Add integrations to your Figma plugin project')
		.argument('[integration]', 'Integration to add: tailwind, eslint, playwright, vitest, shadcn')
		.option('-d, --debug', 'Enable debug mode', debugDefault)
		.action(onAction)
		.addHelpText('after', getAddExamplesText(commandName));
}
