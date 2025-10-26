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
import { CreateCommandOptions } from './utils/create-options.js';
import { promptAndInstallDependencies } from './utils/dependency-installer.js';
import { promptForIntegrations } from './utils/integration-prompter.js';
import { createIntegrationSetupTask, createPostSetupTask } from './utils/integration-task-builder.js';
import { writeIntegrationNextSteps } from './utils/integration-next-steps.js';
import { getCommand, type PackageManager, formatAndDisplaySuccessMessageWithSteps } from './shared/index.js';

// Import necessary modules for dependency installation
import { detect } from 'package-manager-detector/detect';
import { showCreatePlugmaPrompt } from './utils/show-prompt.js';

/**
 * Determine install behavior based on CLI flags
 * Returns: { skipInstallPrompt: boolean, installDependencies: boolean, selectedPackageManager: string | null }
 */
function determineInstallBehavior(options: CreateCommandOptions, defaultPM: string) {
	if (options.debug) {
		console.log(
			`Debug: determineInstallBehavior called with options.noInstall=${options.noInstall}, options.install=${options.install}, options.yes=${options.yes}, defaultPM=${defaultPM}`,
		);
	}

	// --no-install: Don't show prompt, don't install
	if (options.noInstall) {
		return {
			skipInstallPrompt: true,
			installDependencies: false,
			selectedPackageManager: null,
		};
	}

	// --install <pkg-manager>: Don't show prompt, install with specified package manager
	if (options.install && typeof options.install === 'string') {
		return {
			skipInstallPrompt: true,
			installDependencies: true,
			selectedPackageManager: options.install,
		};
	}

	// --install (no package manager): Don't show prompt, install with detected package manager
	if (options.install === true) {
		return {
			skipInstallPrompt: true,
			installDependencies: true,
			selectedPackageManager: defaultPM,
		};
	}

	// --yes: Don't show prompt, install with detected package manager
	if (options.yes) {
		return {
			skipInstallPrompt: true,
			installDependencies: true,
			selectedPackageManager: defaultPM,
		};
	}

	// No --install flag provided: Show prompt, let user decide
	if (options.install === undefined) {
		return {
			skipInstallPrompt: false,
			installDependencies: true, // This will be overridden by user choice in the prompt
			selectedPackageManager: null,
		};
	}

	// Default: Show prompt, let user decide
	return {
		skipInstallPrompt: false,
		installDependencies: true, // This will be overridden by user choice in the prompt
		selectedPackageManager: null,
	};
}

/**
 * Project information interface to consolidate project name and directory handling
 */
interface ProjectInfo {
	/** Raw directory name (e.g., "my-plugin") */
	dirName: string;
	/** Formatted display name (e.g., "My Plugin") */
	displayName: string;
	/** Full path to the project directory */
	fullPath: string;
	/** Parent directory path */
	parentDir: string;
}

/**
 * Convert directory name to display format
 * my-plugin -> My Plugin
 */
function formatProjectName(dirName: string): string {
	// Remove figma-plugin- or figma-widget- prefix if present
	let processedName = dirName;
	if (dirName.startsWith('figma-plugin-')) {
		processedName = dirName.slice('figma-plugin-'.length);
	} else if (dirName.startsWith('figma-widget-')) {
		processedName = dirName.slice('figma-widget-'.length);
	}

	return processedName
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * Create a ProjectInfo object from directory name and parent directory
 */
function createProjectInfo(dirName: string, parentDir: string = CURR_DIR): ProjectInfo {
	const fullPath = path.join(parentDir, dirName);
	return {
		dirName,
		displayName: formatProjectName(dirName),
		fullPath,
		parentDir,
	};
}

/**
 * Generate default project name based on type and template
 * Pattern: figma-{type}-{template} or figma-{type} for default template
 */
function generateDefaultProjectName(type: string, templateName?: string): string {
	if (templateName && !templateName.toLowerCase().includes('blank')) {
		const normalizedTemplateName = templateName.toLowerCase().replace(/\s+/g, '-');
		return `figma-${type}-${normalizedTemplateName}`;
	}
	return `figma-${type}`;
}

/**
 * Generate a unique project name by checking if directory exists and incrementing number suffix
 * figma-vue-plugin -> figma-vue-plugin-2 (if figma-vue-plugin exists)
 */
async function generateUniqueProjectInfo(baseName: string, baseDir: string = CURR_DIR): Promise<ProjectInfo> {
	let projectName = baseName;
	let counter = 1;

	while (true) {
		const projectPath = path.join(baseDir, projectName);

		try {
			// Check if directory exists
			if (!fs.existsSync(projectPath)) {
				return createProjectInfo(projectName, baseDir);
			}

			// Check if directory is empty (only visible files)
			const files = await fs.promises.readdir(projectPath);
			const visibleFiles = files.filter(
				(file) => !file.startsWith('.') && !['node_modules', 'dist', 'build', '.git'].includes(file),
			);

			// If directory is empty, we can use it
			if (visibleFiles.length === 0) {
				return createProjectInfo(projectName, baseDir);
			}

			// Directory exists and is not empty, try next number
			counter++;
			projectName = `${baseName}-${counter}`;
		} catch (error) {
			// If we can't read the directory, assume it's not available
			counter++;
			projectName = `${baseName}-${counter}`;
		}
	}
}

const CURR_DIR = process.cwd();

// Constants
const NO_UI_OPTION = 'No UI';

/**
 * Helper function to safely output messages that works in both interactive and non-interactive modes
 */
async function safeNote(message: string): Promise<void> {
	try {
		await note(message);
	} catch {
		// If note() fails (no askeroo context), fall back to console.log
		console.log(message);
	}
}

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
	// Templates are now included in the create-plugma package
	const currentDir = dirname(fileURLToPath(import.meta.url));
	return path.join(currentDir, '..', 'templates');
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
 * Main create command implementation
 */
export async function create(options: CreateCommandOptions): Promise<void> {
	// Handle specific template option
	if (options.template) {
		await createFromSpecificTemplate(options);
		return;
	}

	// Check if we should use quick creation (skip all interactive questions)
	// This happens when enough flags are provided to determine all requirements
	// OR when --yes flag is used AND type/framework are provided
	// BUT NOT when integrations need to be selected (unless --no-add is used)
	const hasTypeFlag = options.plugin || options.widget;
	const hasFrameworkFlag = options.framework || options.react || options.svelte || options.vue || options.noUi;
	const needsIntegrationPrompt = options.add === undefined; // Need to prompt if no add flag is used
	const shouldUseQuickCreation =
		Boolean((hasTypeFlag && hasFrameworkFlag && options.dir) || (options.yes && hasTypeFlag && hasFrameworkFlag)) &&
		!needsIntegrationPrompt; // Don't use quick creation if we need to prompt for integrations

	if (options.debug) {
		console.log(
			`Debug: shouldUseQuickCreation=${shouldUseQuickCreation}, hasTypeFlag=${hasTypeFlag}, hasFrameworkFlag=${hasFrameworkFlag}, options.dir=${options.dir}, options.yes=${options.yes}, needsIntegrationPrompt=${needsIntegrationPrompt}`,
		);
	}

	// Determine pre-selected values from CLI flags
	const preSelectedType = hasTypeFlag ? (options.plugin ? 'plugin' : 'widget') : undefined;

	let preSelectedFramework: string | undefined;
	if (hasFrameworkFlag) {
		{
			preSelectedFramework = options.framework || 'React';
			if (options.react) preSelectedFramework = 'React';
			if (options.svelte) preSelectedFramework = 'Svelte';
			if (options.vue) preSelectedFramework = 'Vue';
			if (options.noUi) preSelectedFramework = NO_UI_OPTION;
		}
	}

	// Determine pre-selected TypeScript value from CLI flags
	let preSelectedTypescript: boolean | undefined;
	if (options.noTypescript !== undefined) {
		preSelectedTypescript = !options.noTypescript; // Convert --no-ts to false
	}

	// Determine pre-selected add-ons value from CLI flags
	let preSelectedAddOns: boolean | string[] | undefined;
	if (options.add === false) {
		preSelectedAddOns = false; // --no-add was used
		if (options.debug) {
			console.log(
				`Debug: --no-add flag processing: options.add=${options.add}, preSelectedAddOns=${preSelectedAddOns}`,
			);
		}
	} else if (options.add !== undefined && Array.isArray(options.add)) {
		preSelectedAddOns = options.add; // Use --add flag values (only if it's an array)
		if (options.debug) {
			console.log(
				`Debug: --add flag processing: options.add=${options.add}, preSelectedAddOns=${preSelectedAddOns}`,
			);
		}
	} else {
		if (options.debug) {
			console.log(`Debug: No add-ons flags: options.add=${options.add}, preSelectedAddOns=${preSelectedAddOns}`);
		}
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
		shouldUseQuickCreation || false,
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
	preSelectedAddOns?: boolean | string[],
	preSelectedInstall?: boolean,
	shouldUseQuickCreation?: boolean,
): Promise<void> {
	const allExamples = getAvailableExamples();
	const visibleExamples = allExamples.filter((example) => !example.metadata.hidden);

	if (visibleExamples.length === 0) {
		await safeNote(chalk.red('No templates available.'));
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
			// Always show the Plugma prompt first
			await showCreatePlugmaPrompt();

			// Handle quick creation (--yes flag with type/framework provided, or all required flags provided)
			if (shouldUseQuickCreation) {
				const type = preSelectedType || 'plugin'; // Default to plugin
				const framework = preSelectedFramework || 'React'; // Default to React
				const typescript = preSelectedTypescript !== undefined ? preSelectedTypescript : true; // Default to true
				const projectInfo = options.dir
					? createProjectInfo(options.dir, CURR_DIR)
					: await generateUniqueProjectInfo(generateDefaultProjectName(type, 'blank')); // Default directory name when --yes is used

				// Check if target project directory is empty when using --yes flag
				if (options.yes) {
					try {
						if (fs.existsSync(projectInfo.fullPath)) {
							const files = await fs.promises.readdir(projectInfo.fullPath);
							// Filter out hidden files and common development files that are safe to ignore
							const visibleFiles = files.filter(
								(file) =>
									!file.startsWith('.') && !['node_modules', 'dist', 'build', '.git'].includes(file),
							);

							if (visibleFiles.length > 0) {
								await note(`[■ Error: Directory ${projectInfo.dirName} is not empty.]{red}`),
									process.exit(1);
							}
						}
					} catch (error) {
						// If we can't read the directory, that's fine - it might not exist yet
						// The createProjectFromOptions function will handle directory creation
					}
				}

				// Detect user's preferred package manager early
				const detectedPM = await detect({ cwd: process.cwd() });
				const defaultPM = detectedPM?.agent || 'npm';

				// Determine install behavior based on CLI flags
				const installBehavior = determineInstallBehavior(options, defaultPM);

				// Handle integrations for quick mode
				let addOnResults: any[] = [];
				let addOnDeps: any = { dependencies: new Set<string>(), devDependencies: new Set<string>() };
				let addOnAnswers: Record<string, Record<string, any>> = {};

				if (preSelectedAddOns !== false && Array.isArray(preSelectedAddOns) && preSelectedAddOns.length > 0) {
					// Process pre-selected integrations
					const integrationResult = await promptForIntegrations({
						preSelectedIntegration: preSelectedAddOns,
						showNoneOption: false,
						requireSelection: false,
						framework,
					});
					addOnResults = integrationResult.allResults;
					addOnDeps = integrationResult.allDeps;
					addOnAnswers = integrationResult.integrationAnswers;
				}

				await createProjectFromOptions({
					type,
					framework,
					typescript,
					projectInfo,
					debug: options.debug || false,
					installAddOns:
						preSelectedAddOns === false ? [] : Array.isArray(preSelectedAddOns) ? preSelectedAddOns : [], // Use --add flag values or skip if --no-add
					addOnResults,
					addOnDeps,
					installDependencies: installBehavior.installDependencies,
					selectedPackageManager: installBehavior.selectedPackageManager,
					addOnAnswers,
					preferredPM: defaultPM,
					skipInstallPrompt: installBehavior.skipInstallPrompt,
					verbose: options.verbose,
				});

				return;
			}

			// Determine if we're in --yes mode
			const hasTypeFlag = options.plugin || options.widget;
			const hasFrameworkFlag =
				options.framework || options.react || options.svelte || options.vue || options.noUi;
			const isYesMode = options.yes && (!hasTypeFlag || !hasFrameworkFlag);

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
							label: 'Choose what to create:',
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
								label: 'Select a framework for your UI:',
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

					// Template selection - auto-select first (highest rank) in yes mode, otherwise prompt
					let selectedTemplate: Example;
					if (isYesMode) {
						// Automatically select the first template (highest rank)
						selectedTemplate = sortedExamples[0];
					} else {
						// Create mapping from value to Example and prompt user
						const templateMap = new Map<string, Example>();
						const templateOptions = sortedExamples.map((example, index) => {
							const displayName = getDisplayName(example);
							const description = example.metadata.description || '';

							const type = example.metadata.type || 'plugin';
							const value = `template-${index}`;
							templateMap.set(value, example);

							return {
								value,
								label: displayName,
								hint: `${description}`,
							};
						});

						const selectedTemplateValue = await radio({
							label: `Pick a starting template:`,
							shortLabel: 'Template',
							hintPosition: 'inline-fixed' as const,
							options: templateOptions,
						});

						selectedTemplate = templateMap.get(selectedTemplateValue)!;
					}

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

					// TypeScript confirmation
					let typescript: boolean;
					if (preSelectedTypescript !== undefined) {
						typescript = preSelectedTypescript;
					} else if (isYesMode) {
						// Use default true in yes mode
						typescript = true;
					} else {
						typescript = await confirm({
							label: 'Use TypeScript?',
							shortLabel: 'TypeScript',
							initialValue: true,
						});
					}

					// Add-ons selection - only prompt if not in yes mode
					let selectedAddOns: string[] = [];
					let addOnAnswers: Record<string, Record<string, any>> = {};
					let addOnResults: any[] = [];
					let addOnDeps: any = { dependencies: new Set<string>(), devDependencies: new Set<string>() };

					if (!isYesMode) {
						// Prompt for add-ons in normal mode
						const integrationResult = await promptForIntegrations({
							preSelectedIntegration: preSelectedAddOns,
							showNoneOption: true,
							requireSelection: false,
							hintPosition: 'inline-fixed',
							framework: selectedFramework,
						});

						selectedAddOns = integrationResult.selectedIntegrations;
						addOnAnswers = integrationResult.integrationAnswers;
						addOnResults = integrationResult.allResults;
						addOnDeps = integrationResult.allDeps;
					} else if (preSelectedAddOns !== false && Array.isArray(preSelectedAddOns)) {
						// Use pre-selected add-ons in yes mode
						selectedAddOns = preSelectedAddOns;
					}

					// Generate project name
					const selectedTemplateName = selectedTemplate.metadata.name || selectedTemplate.name;
					const type = selectedTemplate.metadata.type || 'plugin';

					// Project path - auto-generate in yes mode, otherwise prompt
					let projectInfo: ProjectInfo;
					if (isYesMode) {
						// Auto-generate project path in yes mode
						const baseName = options.dir || generateDefaultProjectName(type, selectedTemplateName);
						if (options.dir) {
							projectInfo = createProjectInfo(options.dir, CURR_DIR);
						} else {
							projectInfo = await generateUniqueProjectInfo(
								generateDefaultProjectName(type, selectedTemplateName),
							);
						}
					} else {
						// Prompt for project path in normal mode
						const baseName = generateDefaultProjectName(type, selectedTemplateName);

						// Generate unique project name to check if directory exists (same logic as --yes mode)
						const uniqueProjectInfo = await generateUniqueProjectInfo(options.dir || baseName, CURR_DIR);

						// Ensure initial value is prefixed with ./
						const initialValue = uniqueProjectInfo.dirName;
						const prefixedInitialValue = initialValue.startsWith('./') ? initialValue : `./${initialValue}`;

						const projectPath = await text({
							label: `Where would you like the ${type} to be created?`,
							shortLabel: 'Dir',
							initialValue: prefixedInitialValue,
							onValidate: async (value) => {
								if (!value || value.trim() === '') {
									return 'Project path is required';
								}

								// Normalize the path for validation
								let normalizedValue = value.trim();
								if (
									!normalizedValue.startsWith('./') &&
									!normalizedValue.startsWith('/') &&
									!normalizedValue.match(/^[A-Za-z]:/)
								) {
									normalizedValue = `./${normalizedValue}`;
								}

								const normalizedPath = path.resolve(normalizedValue);
								const projectName = path.basename(normalizedPath);
								const parentDir = path.dirname(normalizedPath);

								// Validate project name
								if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
									return 'Project name can only contain letters, numbers, hyphens, and underscores';
								}

								// Create parent directory if it doesn't exist
								if (!fs.existsSync(parentDir)) {
									try {
										fs.mkdirSync(parentDir, { recursive: true });
									} catch (error) {
										return `Failed to create parent directory "${parentDir}": ${error instanceof Error ? error.message : String(error)}`;
									}
								}

								// Check if parent directory is writable
								try {
									fs.accessSync(parentDir, fs.constants.W_OK);
								} catch {
									return `Parent directory "${parentDir}" is not writable`;
								}

								// Check if project directory already exists
								if (fs.existsSync(normalizedPath)) {
									return `Directory "${projectName}" already exists`;
								}

								return null;
							},
							onSubmit: (value) => {
								// Ensure the submitted value is prefixed with ./ if it's a relative path
								let normalizedValue = value.trim();
								if (
									!normalizedValue.startsWith('./') &&
									!normalizedValue.startsWith('/') &&
									!normalizedValue.match(/^[A-Za-z]:/)
								) {
									normalizedValue = `./${normalizedValue}`;
								}
								return normalizedValue;
							},
						});

						// Extract name and directory from the path
						const normalizedPath = path.resolve(projectPath);
						const projectName = path.basename(normalizedPath);
						const projectDirectory = path.dirname(normalizedPath);
						projectInfo = createProjectInfo(projectName, projectDirectory);
					}

					return {
						selectedType,
						selectedFramework,
						selectedTemplate,
						selectedAddOns,
						addOnAnswers,
						addOnResults,
						addOnDeps,
						typescript,
						projectInfo,
						needsUI,
						type,
					};
				},
				{ flow: 'phased', hideOnCompletion: true },
			);

			// Check if target project directory is empty when using yes mode
			if (isYesMode && options.yes) {
				try {
					if (fs.existsSync(answers.projectInfo.fullPath)) {
						const files = await fs.promises.readdir(answers.projectInfo.fullPath);
						// Filter out hidden files and common development files that are safe to ignore
						const visibleFiles = files.filter(
							(file) =>
								!file.startsWith('.') && !['node_modules', 'dist', 'build', '.git'].includes(file),
						);

						if (visibleFiles.length > 0) {
							await note(`[■ Error: Directory ${answers.projectInfo.dirName} is not empty.]{red}`);
							process.exit(1);
						}
					}
				} catch (error) {
					// If we can't read the directory, that's fine - it might not exist yet
					// The createProjectFromOptions function will handle directory creation
				}
			}

			// Determine install behavior based on CLI flags
			const installBehavior = determineInstallBehavior(options, preferredPM);
			if (options.debug) {
				console.log(`Debug: determineInstallBehavior result:`, installBehavior);
			}

			// Handle integrations for yes mode if add-ons were pre-selected
			let finalAddOnResults = answers.addOnResults;
			let finalAddOnDeps = answers.addOnDeps;
			let finalAddOnAnswers = answers.addOnAnswers;

			if (
				isYesMode &&
				preSelectedAddOns !== false &&
				Array.isArray(preSelectedAddOns) &&
				preSelectedAddOns.length > 0
			) {
				// Process pre-selected integrations
				const integrationResult = await promptForIntegrations({
					preSelectedIntegration: preSelectedAddOns,
					showNoneOption: false,
					requireSelection: false,
					framework: answers.needsUI ? answers.selectedFramework : NO_UI_OPTION,
				});
				finalAddOnResults = integrationResult.allResults;
				finalAddOnDeps = integrationResult.allDeps;
				finalAddOnAnswers = integrationResult.integrationAnswers;
			}

			// Create the project with tasks
			await createProjectFromOptions({
				type: answers.type,
				framework: answers.needsUI ? answers.selectedFramework : NO_UI_OPTION,
				typescript: answers.typescript,
				projectInfo: answers.projectInfo,
				selectedExample: answers.selectedTemplate,
				debug: options.debug || false,
				installAddOns: answers.selectedAddOns,
				addOnResults: finalAddOnResults,
				addOnDeps: finalAddOnDeps,
				installDependencies: installBehavior.installDependencies,
				selectedPackageManager: installBehavior.selectedPackageManager,
				addOnAnswers: finalAddOnAnswers,
				preferredPM,
				skipInstallPrompt: installBehavior.skipInstallPrompt,
				verbose: options.verbose,
			});
		},
		{
			onCancel: async () => {
				const cancel = await spinner('Exiting...', {
					hideOnCompletion: true,
				});

				await cancel.start();
				await sleep(500);
				await cancel.stop();
				process.exit(0);
			},
		},
	);
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
						await safeNote(chalk.gray('Operation cancelled.'));
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
		if (options.noUi) framework = NO_UI_OPTION;

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
		const selectedTemplateName = selectedTemplate.metadata.name || selectedTemplate.name;
		const defaultName = options.dir || generateDefaultProjectName(type, selectedTemplateName);
		const projectInfo = createProjectInfo(defaultName, CURR_DIR);

		// Create the project
		const detectedPM = await detect({ cwd: process.cwd() });
		const defaultPM = detectedPM?.agent || 'npm';

		// Determine install behavior based on CLI flags
		const installBehavior = determineInstallBehavior(options, defaultPM);

		// Handle integrations for template-based quick mode
		let addOnResults: any[] = [];
		let addOnDeps: any = { dependencies: new Set<string>(), devDependencies: new Set<string>() };
		let addOnAnswers: Record<string, Record<string, any>> = {};

		if (!options.noIntegrations && options.add && Array.isArray(options.add) && options.add.length > 0) {
			// Process pre-selected integrations
			const integrationResult = await promptForIntegrations({
				preSelectedIntegration: options.add,
				showNoneOption: false,
				requireSelection: false,
				framework,
			});
			addOnResults = integrationResult.allResults;
			addOnDeps = integrationResult.allDeps;
			addOnAnswers = integrationResult.integrationAnswers;
		}

		await createProjectFromOptions({
			type,
			framework,
			typescript,
			projectInfo,
			selectedExample: selectedTemplate,
			debug: options.debug || false,
			installAddOns: options.noIntegrations ? [] : options.add || [], // Use --add flag values or skip if --no-add
			addOnResults,
			addOnDeps,
			installDependencies: installBehavior.installDependencies,
			selectedPackageManager: installBehavior.selectedPackageManager,
			addOnAnswers,
			preferredPM: defaultPM,
			skipInstallPrompt: installBehavior.skipInstallPrompt,
			verbose: options.verbose,
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
	projectInfo: ProjectInfo;
	selectedExample?: Example;
	debug: boolean;
	installAddOns?: string[];
	addOnResults?: any[];
	addOnDeps?: any;
	installDependencies?: boolean;
	selectedPackageManager?: string | null;
	addOnAnswers?: Record<string, Record<string, any>>;
	preferredPM?: string;
	skipInstallPrompt?: boolean;
	verbose?: boolean;
}): Promise<void> {
	const {
		type,
		framework,
		typescript,
		projectInfo,
		selectedExample,
		debug,
		installAddOns = [],
		addOnResults = [],
		addOnDeps,
		installDependencies = true,
		selectedPackageManager = null,
		addOnAnswers = {},
		preferredPM = 'npm',
		skipInstallPrompt = false,
		verbose = false,
	} = params;

	// Extract the raw directory name from the directory path for cd command
	const rawDirName = projectInfo.dirName; // projectInfo.dirName is the raw directory name (e.g., "my-plugin")
	const destDir = projectInfo.fullPath;
	let dependencyInstallationFailed = false;

	// Shared state for add-on integration results
	const integrationResults: Array<{ integration: any; answers: Record<string, any> }> = [];

	// Create the task list for project setup
	const tasksList: Task[] = [
		{
			label: {
				idle: `Creating ${type} from template...`,
				success: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully!`,
			},
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
					name: projectInfo.displayName, // Use formatted name for display in templates
					type: type.toLowerCase(),
					language: typescript ? 'typescript' : 'javascript',
					framework: framework === NO_UI_OPTION ? null : framework.toLowerCase(),
					example: selectedExample?.name.toLowerCase() || `${type}-blank`,
					typescript,
					hasUI: needsUI,
					description: `A Figma ${type.toLowerCase()} with ${needsUI ? framework : NO_UI_DESCRIPTION} and ${typescript ? 'TypeScript' : 'JavaScript'}`,
				};

				// Generate project using Combino
				// Create a temporary .prettierrc to prevent Prettier from finding parent configs
				const tempPrettierRc = path.join(destDir, '.prettierrc');
				const prettierConfig = {
					useTabs: true,
					semi: true,
					singleQuote: true,
					printWidth: 100,
				};

				// Check if .prettierrc already exists
				let existingPrettierConfig: string | null = null;
				try {
					existingPrettierConfig = await fs.promises.readFile(tempPrettierRc, 'utf-8');
				} catch (error) {
					// File doesn't exist, that's fine
				}

				try {
					// Write temporary Prettier config only if one doesn't exist
					if (!existingPrettierConfig) {
						await fs.promises.mkdir(destDir, { recursive: true });
						await fs.promises.writeFile(tempPrettierRc, JSON.stringify(prettierConfig, null, 2));
					}

					// Suppress console warnings during Combino build
					const originalWarn = console.warn;
					const originalError = console.error;
					console.warn = (...args: any[]) => {
						// Suppress Prettier plugin warnings
						const message = args.join(' ');
						if (!message.includes('prettier-plugin-svelte') && !message.includes('Failed to format')) {
							originalWarn.apply(console, args);
						}
					};
					console.error = (...args: any[]) => {
						// Suppress Prettier plugin errors
						const message = args.join(' ');
						if (!message.includes('prettier-plugin-svelte') && !message.includes('Failed to format')) {
							originalError.apply(console, args);
						}
					};

					try {
						const combino = new Combino();
						await combino.build({
							outputDir: destDir,
							include: templates,
							data: { ...templateData, versions },
							plugins: [rebase(), ejsMate(), stripTS({ skip: typescript })],
							configFileName: 'template.json',
							warnings: false, // Disable warnings to suppress Prettier plugin issues
						});
					} finally {
						// Restore console methods
						console.warn = originalWarn;
						console.error = originalError;
					}
				} finally {
					// Remove temporary Prettier config only if we created it
					if (!existingPrettierConfig) {
						try {
							await fs.promises.unlink(tempPrettierRc);
						} catch (error) {
							// Ignore if file doesn't exist or can't be deleted
						}
					}
				}
			},
		},
	];

	// Add the add-ons task if there are any add-ons selected
	const integrationTask = createIntegrationSetupTask({
		integrationResults: addOnResults,
		workingDirectory: destDir,
		collectResults: integrationResults,
		verbose,
	});

	if (integrationTask) {
		tasksList.push(integrationTask);
	}

	// Run the project creation and add-on tasks
	try {
		await tasks(tasksList, { concurrent: false });
	} catch (error) {
		await safeNote(
			chalk.red('Error creating project: ' + (error instanceof Error ? error.message : String(error))),
		);
		process.exit(1);
	}

	// Write next steps to INTEGRATIONS.md if there are any (before dependency installation)
	const hasNextSteps = await writeIntegrationNextSteps({
		integrationResults: addOnResults,
		outputPath: path.join(destDir, 'INTEGRATIONS.md'),
	});

	// Change to the project directory for dependency installation
	const originalCwd = process.cwd();
	process.chdir(destDir);

	const addOnDependencies = addOnDeps ? (Array.from(addOnDeps.dependencies) as string[]) : [];
	const addOnDevDependencies = addOnDeps ? (Array.from(addOnDeps.devDependencies) as string[]) : [];

	// Prompt for package manager if not skipped
	let pkgManager: string | null = null;

	try {
		if (debug) {
			console.log(
				`Debug: Calling promptAndInstallDependencies with skipInstallPrompt=${skipInstallPrompt}, installDependencies=${installDependencies}, selectedPackageManager=${selectedPackageManager}, preferredPM=${preferredPM}`,
			);
		}

		const result = await promptAndInstallDependencies({
			skipInstallPrompt,
			installDependencies,
			preferredPM,
			selectedPackageManager,
			debug,
			verbose,
			projectPath: destDir,
		});

		if (debug) {
			console.log(
				`Debug: promptAndInstallDependencies returned packageManager=${result.packageManager}, installationFailed=${result.installationFailed}`,
			);
		}

		pkgManager = result.packageManager;
		dependencyInstallationFailed = result.installationFailed;

		// Add postSetup tasks (runs after dependency installation)
		if (addOnResults.length > 0) {
			const postSetupTask = createPostSetupTask({
				integrationResults: addOnResults,
				verbose,
			});

			if (postSetupTask) {
				await tasks.add([postSetupTask]);
			}
		}
	} catch (error) {
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
	const packageManager = pkgManager || selectedPackageManager || 'npm';

	// Build steps array
	const steps: string[] = [];
	steps.push(`1. Change dir \`cd ./${rawDirName}\``);

	// Only show install command if dependencies weren't installed OR if installation failed
	if (!pkgManager || pkgManager === 'skip' || dependencyInstallationFailed) {
		const installCommand = getCommand(packageManager as PackageManager, 'install');
		steps.push(`2. Install depedencies with \`${installCommand}\``);
	}

	const devCommand = getCommand(packageManager as PackageManager, 'dev');
	const stepNum = !pkgManager || pkgManager === 'skip' || dependencyInstallationFailed ? 3 : 2;
	steps.push(`${stepNum}. Use \`${devCommand}\` to start dev server`);
	steps.push(`${stepNum + 1}. Import \`dist/manifest.json\` in Figma`);
	steps.push(`\n\nCheckout https://plugma.dev for more info.`);

	const errorMessage = dependencyInstallationFailed
		? chalk.yellow('Failed to install dependencies, but project was created successfully.')
		: undefined;

	await formatAndDisplaySuccessMessageWithSteps({
		command: 'create',
		title: '[ Next Steps! ]{bgBlue}',
		steps,
		errorMessage,
		hasNextSteps,
	});
}
