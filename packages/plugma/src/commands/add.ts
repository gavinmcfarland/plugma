/**
 * Add new integrations to Plugma
 */

import { Logger } from '../utils/log/logger.js';
import { exec } from 'child_process';
import { detect } from 'package-manager-detector/detect';
import { resolveCommand } from 'package-manager-detector/commands';
// @ts-ignore - enquirer doesn't have types
import enquirer from 'enquirer';
// @ts-ignore - enquirer doesn't have types
const { Select, Toggle } = enquirer;
import chalk from 'chalk';
import { runIntegration } from '../integrations/define-integration.js';
import { createFileHelpers, type FileHelpers } from '../utils/file-helpers.js';
import playwrightIntegration from '../integrations/playwright.js';
import tailwindIntegration from '../integrations/tailwind.js';
import shadcnIntegration from '../integrations/shadcn.js';
import type { Integration } from '../integrations/define-integration.js';
import vitestIntegration from '../integrations/vitest.js';
import eslintIntegration from '../integrations/eslint.js';
import { AddCommandOptions } from '../utils/create-options.js';
import { createSpinner, createBox } from '../utils/cli/spinner.js';

// Helper functions to replace intro/outro
function intro(message: string): void {
	console.log(chalk.bold(message));
	console.log('');
}

function outro(message: string): void {
	console.log('');
	console.log(message);
}

// Legacy spinner function for compatibility
function spinner() {
	return createSpinner();
}

// Note function simulation
function note(content: string, title?: string): void {
	if (title) {
		console.log(chalk.cyan(title + ':'));
	}
	console.log(content);
	console.log('');
}

// Helper to handle cancellation
class CancelError extends Error {
	constructor() {
		super('User cancelled');
		this.name = 'CancelError';
	}
}

function isCancel(value: any): boolean {
	return value === undefined || value === '' || (value instanceof Error && value.message === 'User cancelled');
}

// Enquirer wrapper functions
async function select(options: {
	message: string;
	options: Array<{ label: string; value: any; hint?: string }>;
}): Promise<any> {
	// Create a mapping from display labels to values
	const labelToValue = new Map();

	const choices = options.options.map((opt) => {
		// Strip chalk colors for the mapping key but keep them for display
		const cleanLabel = opt.label.replace(/\u001b\[[0-9;]*m/g, ''); // Remove ANSI color codes
		labelToValue.set(cleanLabel, opt.value);

		return {
			name: cleanLabel,
			message: opt.label, // Keep colors for display
			hint: opt.hint,
		};
	});

	const prompt = new Select({
		name: 'value',
		message: options.message,
		choices,
	});

	try {
		const selectedLabel = await prompt.run();
		return labelToValue.get(selectedLabel);
	} catch (error) {
		throw new CancelError();
	}
}

async function confirm(options: { message: string; initialValue?: boolean }): Promise<boolean> {
	const prompt = new Toggle({
		name: 'value',
		message: options.message,
		enabled: 'Yes',
		disabled: 'No',
		initial: options.initialValue,
	});

	try {
		return await prompt.run();
	} catch (error) {
		throw new CancelError();
	}
}

// Define available integrations and their types
const INTEGRATIONS = {
	tailwind: tailwindIntegration,
	shadcn: shadcnIntegration,
	eslint: eslintIntegration,
	vitest: vitestIntegration,
	playwright: playwrightIntegration,
	// Add other integrations here...
} as const;

type IntegrationKey = keyof typeof INTEGRATIONS;

interface DependencyCollection {
	dependencies: Set<string>;
	devDependencies: Set<string>;
}

interface RequiredIntegrationResult {
	integration: Integration;
	answers: Record<string, any>;
}

/**
 * Safely reads a file and returns its content or null if it doesn't exist
 */
async function safeReadFile(helpers: FileHelpers, filePath: string): Promise<string | null> {
	try {
		return await helpers.readFile(filePath);
	} catch (error) {
		// If file doesn't exist, return null
		if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
			return null;
		}
		// Re-throw other errors
		throw error;
	}
}

/**
 * Safely reads and parses a JSON file
 */
async function safeReadJson(helpers: FileHelpers, filePath: string): Promise<any | null> {
	try {
		const content = await helpers.readFile(filePath);
		return JSON.parse(content);
	} catch (error) {
		return null;
	}
}

/**
 * Detects if an integration is fully installed by checking ALL essential components
 */
async function isIntegrationInstalled(integrationId: string): Promise<boolean> {
	const helpers = createFileHelpers();

	switch (integrationId) {
		case 'tailwind': {
			// Must have BOTH: CSS import AND Vite plugin
			let hasCssImport = false;
			let hasVitePlugin = false;

			// Check for @import "tailwindcss" in CSS files
			const cssLocations = ['src/styles.css', 'src/app.css', 'src/index.css', 'src/ui/styles.css'];
			for (const cssPath of cssLocations) {
				const cssContent = await safeReadFile(helpers, cssPath);
				if (cssContent && cssContent.includes('@import "tailwindcss"')) {
					hasCssImport = true;
					break;
				}
			}

			// Check for tailwindcss plugin in vite config
			const viteConfigFile = await helpers.detectViteConfigFile();
			if (viteConfigFile) {
				const viteContent = await safeReadFile(helpers, viteConfigFile);
				if (viteContent && viteContent.includes('@tailwindcss/vite')) {
					hasVitePlugin = true;
				}
			}

			return hasCssImport && hasVitePlugin;
		}

		case 'shadcn': {
			// Must have BOTH: components.json AND TypeScript path aliases
			const componentsJson = await safeReadFile(helpers, 'components.json');
			if (!componentsJson) return false;

			// Check for TypeScript path aliases in tsconfig files
			const tsConfigFiles = ['tsconfig.json', 'tsconfig.ui.json'];
			for (const configFile of tsConfigFiles) {
				const tsConfig = await safeReadJson(helpers, configFile);
				if (tsConfig?.compilerOptions?.paths?.['@/*']) {
					return true; // Found path aliases
				}
			}

			return false; // Has components.json but no path aliases
		}

		case 'playwright': {
			// Must have ALL: config file, package.json script, and example test
			const playwrightTs = await safeReadFile(helpers, 'playwright.config.ts');
			const playwrightJs = await safeReadFile(helpers, 'playwright.config.js');
			const hasConfig = playwrightTs !== null || playwrightJs !== null;

			if (!hasConfig) return false;

			// Check for package.json script
			const packageJson = await safeReadJson(helpers, 'package.json');
			const hasScript = packageJson?.scripts?.playwright;

			// Check for example test file
			const exampleTestTs = await safeReadFile(helpers, 'playwright/example.spec.ts');
			const exampleTestJs = await safeReadFile(helpers, 'playwright/example.spec.js');
			const hasExampleTest = exampleTestTs !== null || exampleTestJs !== null;

			return hasConfig && hasScript && hasExampleTest;
		}

		case 'vitest': {
			// Must have ALL: config file, package.json script, and example test
			const vitestTs = await safeReadFile(helpers, 'vitest.config.ts');
			const vitestJs = await safeReadFile(helpers, 'vitest.config.js');
			const hasConfig = vitestTs !== null || vitestJs !== null;

			if (!hasConfig) return false;

			// Check for package.json script
			const packageJson = await safeReadJson(helpers, 'package.json');
			const hasScript = packageJson?.scripts?.vitest;

			// Check for example test file
			const exampleTestTs = await safeReadFile(helpers, 'vitest/example.test.ts');
			const exampleTestJs = await safeReadFile(helpers, 'vitest/example.test.js');
			const hasExampleTest = exampleTestTs !== null || exampleTestJs !== null;

			return hasConfig && hasScript && hasExampleTest;
		}

		case 'eslint': {
			// Must have BOTH: config file AND package.json script
			const eslintConfig = await safeReadFile(helpers, 'eslint.config.js');
			if (!eslintConfig) return false;

			// Check for package.json script
			const packageJson = await safeReadJson(helpers, 'package.json');
			const hasScript = packageJson?.scripts?.lint;

			return hasScript !== undefined;
		}

		default:
			// For unknown integrations, assume not installed
			return false;
	}
}

interface RunIntegrationOptions {
	name: string;
	prefixPrompts?: boolean;
}

async function installRequiredIntegrations(
	integration: Integration,
	allDeps: DependencyCollection,
): Promise<RequiredIntegrationResult[] | null> {
	if (!integration.requires?.length) return [];

	// Check which required integrations are already installed
	const requiredIntegrations = integration.requires.map((id) => INTEGRATIONS[id as IntegrationKey]);
	const installationStatus = await Promise.all(
		integration.requires.map(async (id) => ({
			id,
			integration: INTEGRATIONS[id as IntegrationKey],
			isInstalled: await isIntegrationInstalled(id),
		})),
	);

	const alreadyInstalled = installationStatus.filter((item) => item.isInstalled);
	const needsInstallation = installationStatus.filter((item) => !item.isInstalled);

	// Only show status if there are integrations that need to be installed
	if (needsInstallation.length > 0) {
		// Show status of required integrations
		if (alreadyInstalled.length > 0) {
			note(
				`${integration.name} requires the following integrations:\n` +
					alreadyInstalled.map((item) => `  ✓ ${item.integration.name} (already installed)`).join('\n') +
					'\n' +
					needsInstallation.map((item) => `  • ${item.integration.name}`).join('\n'),
				'Required Integrations',
			);
		} else {
			note(
				`${integration.name} requires the following integrations:\n` +
					needsInstallation.map((item) => `  • ${item.integration.name}`).join('\n'),
				'Required Integrations',
			);
		}
	} else {
		// If all required integrations are already installed, don't show any messages
		return [];
	}

	const shouldInstall = await confirm({
		message: `Would you like to install the missing integrations (${needsInstallation.map((item) => item.integration.name).join(', ')})?`,
		initialValue: true,
	});

	if (isCancel(shouldInstall) || !shouldInstall) {
		return null;
	}

	const requiredResults: RequiredIntegrationResult[] = [];

	// Setup each required integration that needs installation (but don't run postSetup yet)
	for (const item of needsInstallation) {
		const result = await runIntegration(item.integration, {
			name: item.integration.name,
			prefixPrompts: true,
		});

		if (!result) {
			return null;
		}

		// Store the result for later postSetup execution
		requiredResults.push({
			integration: item.integration,
			answers: result.answers,
		});

		// Collect dependencies from required integration
		result.dependencies.forEach((dep) => allDeps.dependencies.add(dep));
		result.devDependencies.forEach((dep) => allDeps.devDependencies.add(dep));
	}

	return requiredResults;
}

export async function add(options: AddCommandOptions): Promise<void> {
	const log = new Logger({ debug: options.debug });

	try {
		let selectedIntegration: string;

		// If integration is provided via CLI argument, use it directly
		if (options.integration && options.integration in INTEGRATIONS) {
			selectedIntegration = options.integration;
		} else if (options.integration) {
			// If invalid integration provided, show error and available options
			console.error(chalk.red(`Integration "${options.integration}" not found.`));
			console.log(chalk.yellow('Available integrations:'));
			for (const [key, integration] of Object.entries(INTEGRATIONS)) {
				console.log(`  ${chalk.green(key)} - ${integration.description}`);
			}
			process.exit(1);
		} else {
			// No integration provided, show selection prompt
			selectedIntegration = await select({
				message: 'Choose an add-on:',
				options: Object.entries(INTEGRATIONS).map(([value, integration]) => ({
					value,
					label: integration.name,
					hint: integration.description,
				})),
			});

			if (isCancel(selectedIntegration)) {
				outro('Operation cancelled');
				process.exit(0);
			}
		}

		const integration = INTEGRATIONS[selectedIntegration as IntegrationKey];

		// Create collection for all dependencies
		const allDeps: DependencyCollection = {
			dependencies: new Set<string>(),
			devDependencies: new Set<string>(),
		};

		// Handle required integrations first
		const requiredResults = await installRequiredIntegrations(integration, allDeps);
		if (requiredResults === null) {
			outro('Operation cancelled');
			process.exit(0);
		}

		const result = await runIntegration(integration, {
			name: integration.name,
			prefixPrompts: true,
		});

		if (!result) {
			outro('Operation cancelled');
			process.exit(0);
		}

		// Add main integration dependencies to collection
		result.dependencies.forEach((dep) => allDeps.dependencies.add(dep));
		result.devDependencies.forEach((dep) => allDeps.devDependencies.add(dep));

		// Install all collected dependencies
		const depsArray = Array.from(allDeps.dependencies);
		const devDepsArray = Array.from(allDeps.devDependencies);

		if (depsArray.length > 0 || devDepsArray.length > 0) {
			const shouldInstall = await confirm({
				message: 'Install dependencies?',
				initialValue: true,
			});

			if (isCancel(shouldInstall)) {
				outro('Operation cancelled');
				process.exit(0);
			}

			// Run postSetup hooks for required integrations first, then main integration
			const helpers = createFileHelpers();
			const typescript = await helpers.detectTypeScript();

			// Run postSetup for all required integrations first
			for (const requiredResult of requiredResults) {
				if (requiredResult.integration.postSetup) {
					await requiredResult.integration.postSetup({
						answers: requiredResult.answers,
						helpers,
						typescript,
					});
				}
			}

			// Then run postSetup for the main integration
			if (integration.postSetup) {
				await integration.postSetup({ answers: result.answers, helpers, typescript });
			}

			if (shouldInstall) {
				const s = spinner();
				// Detect package manager first to show in message
				const pm = await detect({ cwd: process.cwd() });
				const packageManager = pm?.agent || 'npm';

				s.start(`Installing all dependencies with ${packageManager}...`);
				try {
					await installDependencies(depsArray, devDepsArray);
					s.stop();
				} catch (error) {
					s.fail('Failed to install dependencies');
					throw error;
				}
			} else {
				const dependencySections = [];

				if (depsArray.length > 0) {
					dependencySections.push(
						`Dependencies:\n${depsArray.map((dep) => `  • ${chalk.green(dep)}`).join('\n')}`,
					);
				}

				if (devDepsArray.length > 0) {
					dependencySections.push(
						`Dev dependencies:\n${devDepsArray.map((dep) => `  • ${chalk.green(dep)}`).join('\n')}`,
					);
				}

				console.log(
					createBox(
						`You can install the dependencies later by running:\n\n${dependencySections.join('\n\n')}`,
						{
							type: 'info',
							title: 'Info',
						},
					),
				);
			}
		}

		// Show success message with next steps in a nice box
		const nextStepsContent = result.nextSteps
			? Array.isArray(result.nextSteps)
				? result.nextSteps.join('\n')
				: result.nextSteps
			: null;

		const successMessage = nextStepsContent
			? `Next steps:\n${nextStepsContent
					.split('\n')
					.map((line) => `  ${line}`)
					.join('\n')}`
			: undefined;

		console.log(
			createBox(successMessage, {
				type: 'success',
				title: 'Success',
			}),
		);
	} catch (error) {
		// Handle user cancellation gracefully
		if (error instanceof CancelError || (error instanceof Error && error.message === 'User cancelled')) {
			outro('Operation cancelled');
			process.exit(0);
		}

		const errorMessage = error instanceof Error ? error.message : String(error);

		// Show error message in a nice box
		console.log(
			createBox(undefined, {
				type: 'error',
				title: 'Integration Error',
			}),
		);

		log.error('Failed to add integration:', errorMessage);
		throw error;
	}
}

async function installDependencies(dependencies: string[], devDependencies: string[]): Promise<void> {
	const pm = await detect({ cwd: process.cwd() });
	if (!pm) throw new Error('Could not detect package manager');

	return new Promise((resolve, reject) => {
		const resolved = resolveCommand(pm.agent, 'add', [...dependencies, ...devDependencies]);
		if (!resolved) throw new Error('Could not resolve package manager command');
		exec(`${resolved.command} ${resolved.args.join(' ')}`, (error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});
	});
}
