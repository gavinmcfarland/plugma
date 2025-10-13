/**
 * Create a new Figma plugin project
 * Ported from create-plugma package to unify CLI commands
 */

import { Combino } from 'combino';
import { ask, group, text, confirm, radio, multi, tasks, note, type Task, completedFields, spinner } from 'askeroo';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import stripTS from '@combino/plugin-strip-ts';
import ejsMate from '@combino/plugin-ejs-mate';
import rebase from '@combino/plugin-rebase';
import { CreateCommandOptions } from '../utils/create-options.js';
import { createDebugAwareLogger } from '../utils/debug-aware-logger.js';
import { createSpinner, createBox } from '../utils/cli/spinner.js';

// Import necessary modules for dependency installation
import { exec } from 'node:child_process';
import { detect } from 'package-manager-detector/detect';
import { resolveCommand } from 'package-manager-detector/commands';

const CURR_DIR = process.cwd();

// Constants
const NO_UI_OPTION = 'No UI';
const NO_UI_DESCRIPTION = 'no UI';

// Helper to handle cancellation
class CancelError extends Error {
	constructor() {
		super('User cancelled');
		this.name = 'CancelError';
	}
}

// Sleep helper function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ExampleMetadata {
	name?: string;
	frameworks?: string[] | string;
	type?: string;
	description?: string;
	hidden?: boolean;
	rank?: number;
}

interface Example {
	name: string;
	metadata: ExampleMetadata;
}

interface TemplateData {
	name: string;
	type: string;
	language: string;
	framework: string | null;
	example: string;
	typescript: boolean;
	hasUI: boolean;
	description: string;
}

/**
 * Get the plugma template directory path
 */
function getTemplatesPath(): string {
	// Templates are now included in the plugma package itself
	const currentDir = dirname(fileURLToPath(import.meta.url));
	return path.join(currentDir, '..', '..', 'templates');
}

/**
 * Get available examples from the templates directory
 */
function getAvailableExamples(): Example[] {
	const templatesPath = getTemplatesPath();
	const examplesPath = path.join(templatesPath, 'examples');

	if (!fs.existsSync(examplesPath)) {
		console.error(chalk.red(`Templates directory not found at: ${examplesPath}`));
		console.error(chalk.red('Make sure create-plugma package is available.'));
		process.exit(1);
	}

	const examples: Example[] = [];
	const exampleDirs = fs.readdirSync(examplesPath);

	for (const dir of exampleDirs) {
		const examplePath = path.join(examplesPath, dir);
		const stat = fs.statSync(examplePath);

		if (stat.isDirectory()) {
			const templateJsonPath = path.join(examplePath, 'template.json');
			let metadata: ExampleMetadata = {};

			if (fs.existsSync(templateJsonPath)) {
				try {
					const templateJson = JSON.parse(fs.readFileSync(templateJsonPath, 'utf8'));
					metadata = templateJson.meta || {};
				} catch (error) {
					console.warn(chalk.yellow(`Warning: Could not parse template.json for ${dir}`));
				}
			}

			examples.push({
				name: dir,
				metadata,
			});
		}
	}

	return examples;
}

/**
 * Get all available types from examples
 */
function getAllAvailableTypes(examples: Example[]): string[] {
	const types = new Set<string>();

	for (const example of examples) {
		if (example.metadata.type && !example.metadata.hidden) {
			types.add(example.metadata.type);
		}
	}

	return Array.from(types);
}

/**
 * Check if an example has UI
 */
function exampleHasUI(metadata: ExampleMetadata): boolean {
	return !!(metadata.frameworks && metadata.frameworks.length > 0);
}

/**
 * Get available frameworks from examples
 */
function getAvailableFrameworks(examples: Example[]): string[] {
	const frameworks = new Set<string>();

	for (const example of examples) {
		if (example.metadata.frameworks && !example.metadata.hidden) {
			const exampleFrameworks = Array.isArray(example.metadata.frameworks)
				? example.metadata.frameworks
				: [example.metadata.frameworks];

			for (const framework of exampleFrameworks) {
				frameworks.add(framework);
			}
		}
	}

	// Sort frameworks in desired order: React, Svelte, Vue, then others alphabetically
	return Array.from(frameworks).sort((a, b) => {
		const order = ['react', 'svelte', 'vue'];
		const aIndex = order.indexOf(a.toLowerCase());
		const bIndex = order.indexOf(b.toLowerCase());

		// If both are in the order array, sort by their position
		if (aIndex !== -1 && bIndex !== -1) {
			return aIndex - bIndex;
		}

		// If only one is in the order array, prioritize it
		if (aIndex !== -1) return -1;
		if (bIndex !== -1) return 1;

		// If neither is in the order array, sort alphabetically
		return a.localeCompare(b);
	});
}

/**
 * Get display name for an example
 */
function getDisplayName(example: Example): string {
	return example.metadata.name || example.name;
}

/**
 * Filter examples based on criteria
 */
function filterExamples(examples: Example[], needsUI: boolean, framework: string): Example[] {
	return examples.filter((example) => {
		const { metadata } = example;

		// Skip hidden examples
		if (metadata.hidden) return false;

		// Check UI requirement
		const hasUI = exampleHasUI(metadata);
		if (needsUI && !hasUI) return false;
		if (!needsUI && hasUI) return false;

		// Check framework match if UI is needed
		if (needsUI && framework !== NO_UI_OPTION) {
			const exampleFrameworks = Array.isArray(metadata.frameworks)
				? metadata.frameworks
				: metadata.frameworks
					? [metadata.frameworks]
					: [];

			// Case-insensitive framework comparison
			const frameworkLower = framework.toLowerCase();
			const hasMatchingFramework = exampleFrameworks.some((fw) => fw.toLowerCase() === frameworkLower);
			if (!hasMatchingFramework) return false;
		}

		return true;
	});
}

/**
 * Clear a directory if it exists
 */
function clearDirectory(dirPath: string): void {
	if (fs.existsSync(dirPath)) {
		fs.rmSync(dirPath, { recursive: true, force: true });
	}
}

/**
 * Validate project name
 */
function validateProjectName(name: string): string | undefined {
	if (!name.trim()) {
		return 'Project name is required';
	}

	// Check for invalid characters
	if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
		return 'Project name can only contain letters, numbers, hyphens, and underscores';
	}

	// Check if directory already exists
	const projectPath = path.join(CURR_DIR, name);
	if (fs.existsSync(projectPath)) {
		return `Directory "${name}" already exists`;
	}

	return undefined;
}

/**
 * Get versions from create-plugma package
 */
function getVersions(): Record<string, string> {
	const templatesPath = getTemplatesPath();
	const versionsPath = path.join(templatesPath, '..', 'versions.json');

	if (fs.existsSync(versionsPath)) {
		try {
			return JSON.parse(fs.readFileSync(versionsPath, 'utf8'));
		} catch (error) {
			console.warn(chalk.yellow('Warning: Could not read versions.json'));
		}
	}

	return {};
}

/**
 * Install recommended add-ons for a specific project
 */
async function installRecommendedAddOns(
	selectedAddOns: string[],
	addOnAnswers: Record<string, Record<string, any>> = {},
): Promise<{ dependencies: string[]; devDependencies: string[] }> {
	if (selectedAddOns.length === 0) {
		console.log(chalk.blue('Skipping add-ons installation. You can install add-ons later using: plugma add'));
		return { dependencies: [], devDependencies: [] };
	}

	// Import the integrations from the add command
	const playwrightIntegration = await import('../integrations/playwright.js');
	const tailwindIntegration = await import('../integrations/tailwind.js');
	const shadcnIntegration = await import('../integrations/shadcn.js');
	const vitestIntegration = await import('../integrations/vitest.js');
	const eslintIntegration = await import('../integrations/eslint.js');
	const { runIntegration } = await import('../integrations/define-integration.js');
	const { createFileHelpers } = await import('../utils/file-helpers.js');

	const INTEGRATIONS = {
		tailwind: tailwindIntegration.default,
		shadcn: shadcnIntegration.default,
		eslint: eslintIntegration.default,
		vitest: vitestIntegration.default,
		playwright: playwrightIntegration.default,
	};

	// Collection for all dependencies
	const allDeps = {
		dependencies: new Set<string>(),
		devDependencies: new Set<string>(),
	};

	// Store results for postSetup hooks
	const integrationResults: Array<{ integration: any; answers: Record<string, any> }> = [];

	for (const addOnKey of selectedAddOns) {
		if (addOnKey in INTEGRATIONS) {
			try {
				const s = createSpinner();
				s.start(`Setting up ${addOnKey}...`);

				const integration = INTEGRATIONS[addOnKey as keyof typeof INTEGRATIONS];

				// Use pre-collected answers if available, otherwise run integration normally
				let result;
				if (addOnAnswers[addOnKey]) {
					// Use pre-collected answers and run the full integration setup
					const helpers = createFileHelpers();
					const typescript = await helpers.detectTypeScript();

					// Run setup function if provided (now the project exists, so file operations are safe)
					if (integration.setup) {
						await integration.setup({ answers: addOnAnswers[addOnKey], helpers, typescript });
					}

					result = {
						answers: addOnAnswers[addOnKey],
						dependencies: integration.dependencies || [],
						devDependencies: integration.devDependencies || [],
						files: integration.files || [],
						nextSteps: integration.nextSteps?.(addOnAnswers[addOnKey]) || [],
					};
				} else {
					// No pre-collected answers, run integration normally (shouldn't happen in create flow)
					result = await runIntegration(integration, {
						name: integration.name,
						prefixPrompts: false, // Don't prefix prompts since we're in the create flow
					});
				}

				if (result) {
					s.stop();
					console.log(chalk.green(`✓ ${integration.name} configured successfully`));

					// Collect dependencies
					result.dependencies.forEach((dep) => allDeps.dependencies.add(dep));
					result.devDependencies.forEach((dep) => allDeps.devDependencies.add(dep));

					// Store for postSetup
					integrationResults.push({ integration, answers: result.answers });
				} else {
					s.fail(`Failed to configure ${addOnKey}`);
				}
			} catch (error) {
				console.error(
					chalk.red(
						`Failed to configure ${addOnKey}: ${error instanceof Error ? error.message : String(error)}`,
					),
				);
			}
		} else {
			console.warn(chalk.yellow(`Unknown add-on: ${addOnKey}`));
		}
	}

	// Run postSetup hooks for all integrations
	if (integrationResults.length > 0) {
		const helpers = createFileHelpers();
		const typescript = await helpers.detectTypeScript();

		for (const { integration, answers } of integrationResults) {
			if (integration.postSetup) {
				try {
					await integration.postSetup({ answers, helpers, typescript });
				} catch (error) {
					console.warn(
						chalk.yellow(
							`Warning: PostSetup failed for ${integration.name}: ${error instanceof Error ? error.message : String(error)}`,
						),
					);
				}
			}
		}
	}

	return {
		dependencies: Array.from(allDeps.dependencies),
		devDependencies: Array.from(allDeps.devDependencies),
	};
}

/**
 * Install project dependencies from package.json
 */
async function installProjectDependencies(packageManager: string): Promise<void> {
	const resolved = resolveCommand(packageManager as any, 'install', []);
	if (!resolved) {
		throw new Error(`Could not resolve package manager command for ${packageManager}`);
	}

	return new Promise((resolve, reject) => {
		exec(`${resolved.command} ${resolved.args.join(' ')}`, (error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});
	});
}

/**
 * Install specific dependencies (borrowed from add command logic)
 */
async function installSpecificDependencies(
	dependencies: string[],
	devDependencies: string[],
	packageManager: string,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const resolved = resolveCommand(packageManager as any, 'add', [...dependencies, ...devDependencies]);
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

/**
 * Main create command implementation
 */
export async function create(options: CreateCommandOptions): Promise<void> {
	const logger = createDebugAwareLogger(options.debug);

	// Handle specific template option
	if (options.template) {
		await createFromSpecificTemplate(options);
		return;
	}

	// Check if we should use quick creation (skip all interactive questions)
	// This happens when enough flags are provided to determine all requirements
	const hasTypeFlag = options.plugin || options.widget;
	const hasFrameworkFlag = options.framework || options.react || options.svelte || options.vue || options.noUi;

	// Only use fully quick creation if we have type, framework, AND name specified
	if (hasTypeFlag && hasFrameworkFlag && options.name) {
		const type = options.plugin ? 'plugin' : 'widget';

		// Determine framework from various options
		let framework = options.framework || 'React';
		if (options.react) framework = 'React';
		if (options.svelte) framework = 'Svelte';
		if (options.vue) framework = 'Vue';

		const typescript = !options.noTypescript; // Default to true unless --no-typescript is specified

		// Create project with defaults
		const detectedPM = await detect({ cwd: process.cwd() });
		const defaultPM = detectedPM?.agent || 'npm';

		await createProjectFromOptions({
			type,
			framework: options.noUi ? NO_UI_OPTION : framework,
			typescript,
			name: options.name,
			debug: options.debug || false,
			installAddOns: options.noAddOns ? [] : [], // Skip add-ons in quick mode
			installDependencies: !options.noInstall,
			selectedPackageManager: !options.noInstall ? defaultPM : null, // Use detected package manager
			addOnAnswers: {}, // No add-ons in quick mode
		});

		return;
	}

	// Determine pre-selected values from CLI flags
	const preSelectedType = hasTypeFlag ? (options.plugin ? 'plugin' : 'widget') : undefined;

	let preSelectedFramework: string | undefined;
	if (hasFrameworkFlag) {
		if (options.noUi) {
			preSelectedFramework = NO_UI_OPTION;
		} else {
			preSelectedFramework = options.framework || 'React';
			if (options.react) preSelectedFramework = 'React';
			if (options.svelte) preSelectedFramework = 'Svelte';
			if (options.vue) preSelectedFramework = 'Vue';
		}
	}

	// Determine pre-selected TypeScript value from CLI flags
	let preSelectedTypescript: boolean | undefined;
	if (options.noTypescript !== undefined) {
		preSelectedTypescript = !options.noTypescript; // Convert --no-typescript to false
	}

	// Determine pre-selected add-ons value from CLI flags
	let preSelectedAddOns: boolean | undefined;
	if (options.noAddOns !== undefined) {
		preSelectedAddOns = !options.noAddOns; // Convert --no-add-ons to false
	}

	// Determine pre-selected install dependencies value from CLI flags
	let preSelectedInstall: boolean | undefined;
	if (options.noInstall !== undefined) {
		preSelectedInstall = !options.noInstall; // Convert --no-install to false
	}

	// Default behavior: use browse functionality (with optional pre-selected values)
	await browseAndSelectTemplate(
		options,
		preSelectedType,
		preSelectedFramework,
		preSelectedTypescript,
		preSelectedAddOns,
		preSelectedInstall,
	);
}

/**
 * Group examples by type
 */
function groupExamplesByType(examples: Example[]): Record<string, Example[]> {
	const grouped: Record<string, Example[]> = {};

	for (const example of examples) {
		if (example.metadata.hidden) continue;

		const type = example.metadata.type || 'unknown';
		if (!grouped[type]) {
			grouped[type] = [];
		}
		grouped[type].push(example);
	}

	// Sort examples within each type by rank
	for (const type in grouped) {
		grouped[type].sort((a, b) => {
			const aRank = a.metadata.rank ?? 0;
			const bRank = b.metadata.rank ?? 0;
			return bRank - aRank;
		});
	}

	return grouped;
}

/**
 * Browse and select template interactively
 */
async function browseAndSelectTemplate(
	options: CreateCommandOptions,
	preSelectedType?: string,
	preSelectedFramework?: string,
	preSelectedTypescript?: boolean,
	preSelectedAddOns?: boolean,
	preSelectedInstall?: boolean,
): Promise<void> {
	const allExamples = getAvailableExamples();
	const visibleExamples = allExamples.filter((example) => !example.metadata.hidden);

	if (visibleExamples.length === 0) {
		await note(chalk.red('No templates available.'));
		process.exit(1);
	}

	// Detect user's preferred package manager early
	const detectedPM = await detect({ cwd: process.cwd() });
	let preferredPM = detectedPM?.agent || 'npm';

	// If no package manager detected in current directory, try to detect from lock files
	if (!detectedPM) {
		let currentDir = process.cwd();
		const maxDepth = 5;
		let depth = 0;

		while (currentDir !== path.dirname(currentDir) && depth < maxDepth) {
			try {
				const files = await fs.promises.readdir(currentDir);

				if (files.includes('yarn.lock')) {
					preferredPM = 'yarn';
					break;
				} else if (files.includes('pnpm-lock.yaml')) {
					preferredPM = 'pnpm';
					break;
				} else if (files.includes('package-lock.json')) {
					preferredPM = 'npm';
					break;
				} else if (files.includes('bun.lockb')) {
					preferredPM = 'bun';
					break;
				}

				currentDir = path.dirname(currentDir);
				depth++;
			} catch {
				break;
			}
		}
	}

	// Run the interactive flow
	const result = await ask(
		async () => {
			await completedFields();

			const answers = await group(
				async () => {
					// Type selection
					let selectedType: string;
					if (preSelectedType) {
						selectedType = preSelectedType;
					} else {
						const availableTypes = Array.from(
							new Set(visibleExamples.map((example) => example.metadata.type).filter(Boolean)),
						).sort((a, b) => {
							if (a === 'plugin') return -1;
							if (b === 'plugin') return 1;
							return a!.localeCompare(b!);
						});

						if (availableTypes.length === 0) {
							throw new Error('No valid template types found.');
						}

						selectedType = await radio({
							label: 'Choose a type:',
							shortLabel: 'Type',
							options: availableTypes.map((type) => ({
								value: type!,
								label: type!.charAt(0).toUpperCase() + type!.slice(1),
							})),
						});
					}

					// Filter templates by selected type
					const typeFilteredExamples = visibleExamples.filter(
						(example) => example.metadata.type === selectedType,
					);

					if (typeFilteredExamples.length === 0) {
						throw new Error(`No templates available for ${selectedType}.`);
					}

					// Framework selection
					let selectedFramework: string;
					if (preSelectedFramework) {
						selectedFramework = preSelectedFramework;
					} else {
						const availableFrameworks = getAvailableFrameworks(typeFilteredExamples);
						const hasNoUIExamples = typeFilteredExamples.some((example) => !exampleHasUI(example.metadata));

						const frameworkOptions = [
							...availableFrameworks.map((framework) => {
								const fwLower = framework.toLowerCase();
								let color: string | undefined;
								if (fwLower === 'react') color = 'red';
								else if (fwLower === 'svelte') color = 'yellow';
								else if (fwLower === 'vue') color = 'green';

								return {
									value: framework,
									label: framework.charAt(0).toUpperCase() + framework.slice(1),
									color,
								};
							}),
							...(hasNoUIExamples ? [{ value: NO_UI_OPTION, label: NO_UI_OPTION }] : []),
						];

						if (frameworkOptions.length === 1) {
							selectedFramework = frameworkOptions[0].value;
						} else {
							selectedFramework = await radio({
								label: 'Choose a framework:',
								shortLabel: 'Framework',
								options: frameworkOptions,
							});
						}
					}

					// Filter templates by both type and framework preference
					const needsUI = selectedFramework !== NO_UI_OPTION;
					const filteredExamples = filterExamples(typeFilteredExamples, needsUI, selectedFramework);

					if (filteredExamples.length === 0) {
						throw new Error(
							`No templates available for ${selectedType} with ${selectedFramework === NO_UI_OPTION ? 'no UI' : selectedFramework}.`,
						);
					}

					// Sort templates by rank
					const sortedExamples = filteredExamples.sort((a, b) => {
						const aRank = a.metadata.rank ?? 0;
						const bRank = b.metadata.rank ?? 0;
						return bRank - aRank;
					});

					// Template selection - create mapping from value to Example
					const templateMap = new Map<string, Example>();
					const templateOptions = sortedExamples.map((example, index) => {
						const displayName = getDisplayName(example);
						const description = example.metadata.description || 'No description';
						const frameworks = example.metadata.frameworks
							? Array.isArray(example.metadata.frameworks)
								? example.metadata.frameworks.join(', ')
								: example.metadata.frameworks
							: 'No UI';

						const type = example.metadata.type || 'plugin';
						const value = `template-${index}`;
						templateMap.set(value, example);

						return {
							value,
							label: displayName,
							hint: `${description} (${frameworks})`,
							color: type === 'plugin' ? 'blue' : 'green',
						};
					});

					const selectedTemplateValue = await radio({
						label: `Choose a ${selectedType} template:`,
						shortLabel: 'Template',
						hintPosition: 'inline-fixed' as const,
						options: templateOptions,
					});

					const selectedTemplate = templateMap.get(selectedTemplateValue)!;

					// Validate that the selected template supports the chosen framework
					const templateNeedsUI = exampleHasUI(selectedTemplate.metadata);
					if (templateNeedsUI && selectedFramework !== NO_UI_OPTION) {
						const availableFrameworks = getFrameworksForExample(selectedTemplate);
						const selectedFrameworkLower = selectedFramework.toLowerCase();
						const supportsFramework = availableFrameworks.some(
							(fw) => fw.toLowerCase() === selectedFrameworkLower,
						);

						if (!supportsFramework) {
							throw new Error(
								`Template "${getDisplayName(selectedTemplate)}" does not support ${selectedFramework}.`,
							);
						}
					}

					// Add-ons selection
					let selectedAddOns: string[] = [];
					if (preSelectedAddOns === false) {
						selectedAddOns = [];
					} else if (preSelectedAddOns === undefined) {
						selectedAddOns = await multi({
							label: 'Choose add-ons:',
							shortLabel: 'Add-ons',
							hintPosition: 'inline-fixed' as const,
							options: [
								{ value: 'tailwind', label: 'Tailwind CSS', hint: 'Utility-first CSS framework' },
								{ value: 'eslint', label: 'ESLint', hint: 'JavaScript linting utility' },
								{ value: 'vitest', label: 'Vitest', hint: 'Fast unit testing framework' },
								{ value: 'playwright', label: 'Playwright', hint: 'End-to-end testing framework' },
								{ value: 'shadcn', label: 'Shadcn/ui', hint: 'Re-usable UI components' },
							],
							noneOption: { label: 'None' },
						});
					}

					// Collect add-on questions and answers (using nested groups if needed)
					const addOnAnswers: Record<string, Record<string, any>> = {};
					if (selectedAddOns.length > 0) {
						// Import the integrations from the add command
						const playwrightIntegration = await import('../integrations/playwright.js');
						const tailwindIntegration = await import('../integrations/tailwind.js');
						const shadcnIntegration = await import('../integrations/shadcn.js');
						const vitestIntegration = await import('../integrations/vitest.js');
						const eslintIntegration = await import('../integrations/eslint.js');
						const { runIntegration } = await import('../integrations/define-integration.js');

						const INTEGRATIONS = {
							tailwind: tailwindIntegration.default,
							shadcn: shadcnIntegration.default,
							eslint: eslintIntegration.default,
							vitest: vitestIntegration.default,
							playwright: playwrightIntegration.default,
						};

						// Ask questions for each selected add-on (without running setup)
						for (const addOnKey of selectedAddOns) {
							if (addOnKey in INTEGRATIONS) {
								const integration = INTEGRATIONS[addOnKey as keyof typeof INTEGRATIONS];

								// Only ask questions if the integration has them
								if (integration.questions && integration.questions.length > 0) {
									// Create a temporary integration that only asks questions without setup
									const questionOnlyIntegration = {
										...integration,
										setup: undefined, // Remove setup to prevent file operations
										postSetup: undefined, // Remove postSetup to prevent file operations
									};

									const result = await runIntegration(questionOnlyIntegration, {
										name: integration.name,
										prefixPrompts: true, // Prefix prompts with add-on name
									});

									if (result) {
										addOnAnswers[addOnKey] = result.answers;
									}
								}
							}
						}
					}

					// TypeScript confirmation
					const typescript =
						preSelectedTypescript !== undefined
							? preSelectedTypescript
							: await confirm({
									label: 'Use TypeScript?',
									shortLabel: 'TypeScript',
									initialValue: true,
								});

					// Generate project name
					const exampleName = selectedTemplate.metadata.name || selectedTemplate.name;
					const normalizedExampleName = exampleName.toLowerCase().replace(/\s+/g, '-');
					const type = selectedTemplate.metadata.type || 'plugin';
					const frameworkPart = needsUI ? `-${selectedFramework.toLowerCase()}` : '';
					const baseName = `${normalizedExampleName}${frameworkPart}-${type}`;

					const projectName = await text({
						label: `${type.charAt(0).toUpperCase() + type.slice(1)} name:`,
						shortLabel: 'Name',
						initialValue: options.name || baseName,
						onValidate: async (value) => {
							const error = validateProjectName(value);
							return error || null;
						},
					});

					return {
						selectedType,
						selectedFramework,
						selectedTemplate,
						selectedAddOns,
						addOnAnswers,
						typescript,
						projectName,
						needsUI,
						type,
					};
				},
				{ flow: 'phased', hideOnCompletion: true },
			);

			return answers;
		},
		{
			onCancel: async () => {
				const cancel = await spinner('Canceling...', {
					color: 'yellow',
					hideOnCompletion: true,
				});

				await cancel.start();
				await sleep(800);
				await cancel.stop('Cancelled');
				// cleanup(); // Clean up UI first
				// console.log("Results:", results);
				process.exit(0); // User controls exit
			},
		},
	);

	// Determine package manager selection
	let selectedPackageManager: string | null = null;
	if (preSelectedInstall !== undefined) {
		selectedPackageManager = preSelectedInstall ? preferredPM : null;
	}

	// Create the project with tasks
	await createProjectFromOptions({
		type: result.type,
		framework: result.needsUI ? result.selectedFramework : NO_UI_OPTION,
		typescript: result.typescript,
		name: result.projectName,
		selectedExample: result.selectedTemplate,
		debug: options.debug || false,
		installAddOns: result.selectedAddOns,
		installDependencies: preSelectedInstall !== false,
		selectedPackageManager: preSelectedInstall === false ? null : preferredPM,
		addOnAnswers: result.addOnAnswers,
	});
}

/**
 * Create project from specific template name
 */
async function createFromSpecificTemplate(options: CreateCommandOptions): Promise<void> {
	try {
		const allExamples = getAvailableExamples();
		const templateName = options.template!;

		// Find all matching templates
		const matchingTemplates = allExamples.filter(
			(example) =>
				example.name === templateName ||
				example.name === `plugin-${templateName}` ||
				example.name === `widget-${templateName}` ||
				(example.metadata.name && example.metadata.name.toLowerCase().replace(/\s+/g, '-') === templateName),
		);

		if (matchingTemplates.length === 0) {
			console.error(chalk.red(`Template "${templateName}" not found.`));
			console.log(chalk.yellow('Available templates:'));
			const visibleExamples = allExamples.filter((example) => !example.metadata.hidden);
			for (const example of visibleExamples) {
				console.log(`  ${chalk.green(example.name)} - ${example.metadata.description || 'No description'}`);
			}
			console.log(
				chalk.yellow('\nTip: Run "plugma create" without --template to see all templates interactively.'),
			);
			process.exit(1);
		}

		let selectedTemplate: Example;

		// Handle disambiguation if multiple templates match
		if (matchingTemplates.length > 1) {
			console.log(chalk.yellow(`Multiple templates found for "${templateName}":`));

			const templateMap = new Map<string, Example>();
			const templateOptions = matchingTemplates.map((template, index) => {
				const displayName = getDisplayName(template);
				const type = template.metadata.type || 'unknown';
				const hasUI = exampleHasUI(template.metadata);
				const frameworks = template.metadata.frameworks;

				// Build the framework part
				let frameworkPart = '';
				if (hasUI && frameworks) {
					const frameworkList = Array.isArray(frameworks) ? frameworks : [frameworks];
					frameworkPart = frameworkList.join('/');
				} else if (!hasUI) {
					frameworkPart = 'no ui';
				}

				// Build the label with square brackets and colors
				const typeInfo = `${type}${frameworkPart ? `, ${frameworkPart}` : ''}`;
				const value = `template-${index}`;
				templateMap.set(value, template);

				return {
					value,
					label: `${displayName} [${typeInfo}]`,
					hint: template.metadata.description || 'No description',
					color: type === 'plugin' ? 'blue' : 'green',
				};
			});

			const templateChoice = await ask(
				async () => {
					return await radio({
						label: 'Which template do you want to use?',
						shortLabel: 'Template',
						hintPosition: 'inline-fixed' as const,
						options: templateOptions,
					});
				},
				{
					onCancel: async () => {
						await note(chalk.gray('Operation cancelled.'));
						process.exit(0);
					},
				},
			);
			selectedTemplate = templateMap.get(templateChoice)!;
		} else {
			selectedTemplate = matchingTemplates[0];
		}

		if (selectedTemplate.metadata.hidden) {
			console.error(chalk.red(`Template "${templateName}" is not available for direct use.`));
			process.exit(1);
		}

		const type = selectedTemplate.metadata.type || 'plugin';
		const needsUI = exampleHasUI(selectedTemplate.metadata);

		// Determine framework from various options
		let framework = options.framework || 'React';
		if (options.react) framework = 'React';
		if (options.svelte) framework = 'Svelte';
		if (options.vue) framework = 'Vue';

		if (!needsUI) {
			framework = NO_UI_OPTION;
		} else if (framework !== 'React') {
			// Check if a specific framework was chosen
			// Validate framework is supported by template
			const availableFrameworks = getFrameworksForExample(selectedTemplate);

			// Case-insensitive framework comparison
			const frameworkLower = framework.toLowerCase();
			const supportsFramework = availableFrameworks.some((fw) => fw.toLowerCase() === frameworkLower);

			if (!supportsFramework) {
				console.error(chalk.red(`Framework "${framework}" is not supported by template "${templateName}".`));
				console.log(chalk.yellow(`Supported frameworks: ${availableFrameworks.join(', ')}`));
				process.exit(1);
			}
		}

		const typescript = !options.noTypescript;

		// Generate project name
		const exampleName = selectedTemplate.metadata.name || selectedTemplate.name;
		const normalizedExampleName = exampleName.toLowerCase().replace(/\s+/g, '-');
		const frameworkPart = needsUI ? `-${framework.toLowerCase()}` : '';
		const defaultName = options.name || `${normalizedExampleName}${frameworkPart}-${type}`;

		// Create the project
		const detectedPM = await detect({ cwd: process.cwd() });
		const defaultPM = detectedPM?.agent || 'npm';

		await createProjectFromOptions({
			type,
			framework,
			typescript,
			name: defaultName,
			selectedExample: selectedTemplate,
			debug: options.debug || false,
			installAddOns: options.noAddOns ? [] : [], // Skip add-ons in quick mode
			installDependencies: !options.noInstall,
			selectedPackageManager: !options.noInstall ? defaultPM : null, // Use detected package manager
			addOnAnswers: {}, // No add-ons in quick mode
		});
	} catch (error) {
		console.error(
			chalk.red('Error creating from template: ' + (error instanceof Error ? error.message : String(error))),
		);
		process.exit(1);
	}
}

/**
 * Get supported frameworks for an example
 */
function getFrameworksForExample(example: Example): string[] {
	const frameworks = example.metadata.frameworks;
	if (!frameworks) return [];

	return Array.isArray(frameworks) ? frameworks : [frameworks];
}

/**
 * Create project from resolved options
 */
async function createProjectFromOptions(params: {
	type: string;
	framework: string;
	typescript: boolean;
	name: string;
	selectedExample?: Example;
	debug: boolean;
	installAddOns?: string[];
	installDependencies?: boolean;
	selectedPackageManager?: string | null;
	addOnAnswers?: Record<string, Record<string, any>>;
}): Promise<void> {
	const {
		type,
		framework,
		typescript,
		name,
		selectedExample,
		debug,
		installAddOns = [],
		installDependencies = true,
		selectedPackageManager = null,
		addOnAnswers = {},
	} = params;

	const destDir = path.join(CURR_DIR, name);
	let dependencyInstallationFailed = false;

	// Create the task list for project setup
	const tasksList: Task[] = [
		{
			label: `Creating ${type} from template`,
			action: async () => {
				const templatesPath = getTemplatesPath();
				const versions = getVersions();
				clearDirectory(destDir);

				// Prepare template paths
				const templates: string[] = [];

				// Add example template if specified
				if (selectedExample) {
					const exampleTemplateDir = path.join(templatesPath, 'examples', selectedExample.name);
					if (fs.existsSync(exampleTemplateDir)) {
						templates.push(exampleTemplateDir);
					}
				} else {
					// Use default based on type and framework
					const defaultExample = framework === NO_UI_OPTION ? `${type}-blank` : `${type}-blank-w-ui`;
					const exampleTemplateDir = path.join(templatesPath, 'examples', defaultExample);
					if (fs.existsSync(exampleTemplateDir)) {
						templates.push(exampleTemplateDir);
					}
				}

				// Add framework template if needed
				if (framework !== NO_UI_OPTION) {
					const frameworkTemplateDir = path.join(templatesPath, 'frameworks', framework.toLowerCase());
					if (fs.existsSync(frameworkTemplateDir)) {
						templates.push(frameworkTemplateDir);
					}
				}

				// Add TypeScript template if needed
				if (typescript) {
					const typescriptTemplateDir = path.join(templatesPath, 'typescript');
					if (fs.existsSync(typescriptTemplateDir)) {
						templates.push(typescriptTemplateDir);
					}
				}

				// Create template data
				const needsUI = framework !== NO_UI_OPTION;
				const templateData: TemplateData = {
					name,
					type: type.toLowerCase(),
					language: typescript ? 'typescript' : 'javascript',
					framework: framework === NO_UI_OPTION ? null : framework.toLowerCase(),
					example: selectedExample?.name.toLowerCase() || `${type}-blank`,
					typescript,
					hasUI: needsUI,
					description: `A Figma ${type.toLowerCase()} with ${needsUI ? framework : NO_UI_DESCRIPTION} and ${typescript ? 'TypeScript' : 'JavaScript'}`,
				};

				// Generate project using Combino
				const combino = new Combino();
				await combino.build({
					outputDir: destDir,
					include: templates,
					data: { ...templateData, versions },
					plugins: [rebase(), ejsMate(), stripTS({ skip: typescript })],
					configFileName: 'template.json',
				});
			},
		},
	];

	// Add add-ons setup task if requested
	if (installAddOns.length > 0) {
		tasksList.push({
			label: 'Integrating chosen add-ons',
			concurrent: true,
			action: async () => {},
			tasks: installAddOns.map((addon) => ({
				label: addon,
				action: async () => {
					// The actual setup will be done later, this is just for display
					await sleep(100);
				},
			})),
		});
	}

	// Run the tasks
	try {
		await tasks(tasksList, { concurrent: false });
	} catch (error) {
		await note(chalk.red('Error creating project: ' + (error instanceof Error ? error.message : String(error))));
		process.exit(1);
	}

	// Change to the project directory for dependency installation and add-on setup
	const originalCwd = process.cwd();
	process.chdir(destDir);

	try {
		// Handle add-ons installation if requested
		let addOnDependencies: string[] = [];
		let addOnDevDependencies: string[] = [];

		if (installAddOns.length > 0) {
			try {
				// Use the add command logic to install recommended add-ons
				const { dependencies, devDependencies } = await installRecommendedAddOns(installAddOns, addOnAnswers);
				addOnDependencies = dependencies;
				addOnDevDependencies = devDependencies;
			} catch (error) {
				console.log(
					createBox(undefined, {
						type: 'error',
						title: 'Add-ons Installation Error',
					}),
				);
				console.error(
					chalk.yellow('Warning: Failed to configure add-ons, but project was created successfully.'),
				);
				if (debug) {
					console.error(error);
				}
			}
		}

		// Install dependencies if requested
		if (installDependencies && selectedPackageManager) {
			const installTask: Task = {
				label: `Installing dependencies with ${selectedPackageManager}`,
				action: async () => {
					try {
						if (addOnDependencies.length > 0 || addOnDevDependencies.length > 0) {
							// Install template dependencies first, then add-on dependencies
							await installProjectDependencies(selectedPackageManager);
							await installSpecificDependencies(
								addOnDependencies,
								addOnDevDependencies,
								selectedPackageManager,
							);
						} else {
							// Only install template dependencies
							await installProjectDependencies(selectedPackageManager);
						}
					} catch (error) {
						dependencyInstallationFailed = true;
						if (debug) {
							console.error('Dependency installation error:', error);
						}
					}
				},
			};

			await tasks.add([installTask]);
		}
	} catch (error) {
		console.log(
			createBox(undefined, {
				type: 'error',
				title: 'Project Creation Error',
			}),
		);
		console.error(chalk.yellow('Warning: Failed to create project.'));
		if (debug) {
			console.error('Detailed error:', error);
		} else {
			console.error('Run with --debug flag for more details.');
		}
	} finally {
		// Change back to original directory
		process.chdir(originalCwd);
	}

	// Build success message with next steps
	const packageManager = selectedPackageManager || 'npm';
	const nextStepsLines: string[] = ['**Plugged in and ready to go!**\n'];

	nextStepsLines.push(`1. \`cd ${name}\``);

	// Only show install command if dependencies weren't already installed OR if installation failed
	if (!installDependencies || dependencyInstallationFailed) {
		const installCommand =
			packageManager === 'npm'
				? 'npm install'
				: packageManager === 'yarn'
					? 'yarn'
					: packageManager === 'pnpm'
						? 'pnpm install'
						: packageManager === 'bun'
							? 'bun install'
							: packageManager === 'deno'
								? 'deno install'
								: 'npm install';
		nextStepsLines.push(`2. \`${installCommand}\``);
	}

	const devCommand =
		packageManager === 'npm'
			? 'npm run dev'
			: packageManager === 'yarn'
				? 'yarn dev'
				: packageManager === 'pnpm'
					? 'pnpm dev'
					: packageManager === 'bun'
						? 'bun run dev'
						: packageManager === 'deno'
							? 'deno run --allow-all dev'
							: 'npm run dev';
	const stepNum = !installDependencies || dependencyInstallationFailed ? 3 : 2;
	nextStepsLines.push(`${stepNum}. \`${devCommand}\``);
	nextStepsLines.push(`${stepNum + 1}. Import \`dist/manifest.json\` in Figma`);
	nextStepsLines.push(`\nCheck the docs out at https://plugma.dev.`);

	const successMessage = nextStepsLines.join('\n');

	await note(successMessage);

	// Show dependency installation error after success message if installation failed
	if (dependencyInstallationFailed) {
		await note(chalk.yellow('Warning: Failed to install dependencies, but project was created successfully.'));
	}
}
