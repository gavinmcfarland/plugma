/**
 * Shared utility for parsing add command arguments
 */

import { Command } from 'commander';

export interface ParsedAddArgs {
	integration?: string | string[];
	debug?: boolean;
	verbose?: boolean;
}

export interface AddCommandConfig {
	debugDefault?: boolean;
	commandName?: string;
	onAction: (integrations: string[] | undefined, options: any) => Promise<void>;
}

/**
 * Parse and validate integration argument for add command
 */
export function parseAddArgs(integration: string | string[] | undefined, existingOptions: any = {}): ParsedAddArgs {
	const enhancedOptions: ParsedAddArgs = { ...existingOptions };

	// Handle integration argument(s)
	if (integration) {
		if (Array.isArray(integration)) {
			// Multiple integrations provided
			// Only set if array is not empty (empty array means no args were provided)
			if (integration.length > 0) {
				enhancedOptions.integration = integration.map((integ) => integ.toLowerCase());
			}
		} else {
			// Single integration provided
			enhancedOptions.integration = integration.toLowerCase();
		}
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
  ${commandName} tailwind eslint shadcn
  ${commandName} tailwind --install pnpm
  ${commandName} tailwind --install
  ${commandName} eslint --no-install
  ${commandName} tailwind eslint shadcn --install
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

	// For subcommands, define the argument in the command() call
	const cmd = asSubcommand ? program.command('add [integrations...]') : program;

	const command = (
		asSubcommand
			? cmd
			: cmd.argument('[integrations...]', 'Integration(s) to add: tailwind, eslint, playwright, vitest, shadcn')
	)
		.description('Add integrations to your Figma plugin project')
		.option('-d, --debug', 'Enable debug mode', debugDefault)
		.option('--verbose', 'Show detailed integration subtasks');

	// Define --install option first with optional argument
	// Note: We define --install before --no-install to avoid Commander.js defaulting install to true
	command.option(
		'--install [pkg-manager]',
		'Install dependencies using a specific package manager (npm, yarn, pnpm) or use detected package manager if none specified',
	);

	// Define --no-install as a separate flag (not as negatable of --install)
	// This prevents Commander.js from creating a conflict that defaults install to true
	command.option('--no-install', 'Skip dependency installation');

	// Wrap the action to fix the install option before passing to the handler
	// Fix: Commander.js incorrectly sets install: true when both --install and --no-install
	// are defined and neither is passed. We check process.argv to see if --install was actually passed.
	const originalAction = onAction;
	const wrappedAction = async (integrations: string[] | undefined, options: any) => {
		// Check if --install was actually passed in the command line arguments
		// Note: --no-install is a single argument, not --no --install
		const args = process.argv;
		const hasInstallFlag = args.includes('--install');

		// If install is true in options but --install flag wasn't passed, remove it
		// This fixes the bug where Commander.js defaults install to true when --no-install is also defined
		if (options.install === true && !hasInstallFlag) {
			delete options.install;
		}

		await originalAction(integrations, options);
	};

	return command.action(wrappedAction).addHelpText('after', getAddExamplesText(commandName));
}
