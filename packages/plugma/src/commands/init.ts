/**
 * Initialize a new Figma plugin project
 * Ported from create-plugma package to unify CLI commands
 */

import { Combino } from 'combino';
// @ts-ignore - enquirer doesn't have types
import enquirer from 'enquirer';
// @ts-ignore - enquirer doesn't have types
const { Select, Input, Confirm, Toggle } = enquirer;
import * as fs from 'node:fs';
import * as path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import stripTS from '@combino/plugin-strip-ts';
import ejsMate from '@combino/plugin-ejs-mate';
import rebase from '@combino/plugin-rebase';
import { InitCommandOptions } from '../utils/create-options.js';
import { createDebugAwareLogger } from '../utils/debug-aware-logger.js';
import { createSpinner, createBox } from '../utils/cli/spinner.js';

const CURR_DIR = process.cwd();

// Constants
const NO_UI_OPTION = 'No UI';
const NO_UI_DESCRIPTION = 'no UI';

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

async function text(options: {
	message: string;
	defaultValue?: string;
	validate?: (value: string) => string | undefined;
}): Promise<string> {
	const prompt = new Input({
		name: 'value',
		message: options.message,
		initial: options.defaultValue,
		validate: options.validate
			? (value: string) => {
					const result = options.validate!(value);
					return result === undefined ? true : result;
				}
			: undefined,
	});

	try {
		return await prompt.run();
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

interface ExampleMetadata {
	name?: string;
	uiFrameworks?: string[] | string;
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
 * Get the create-plugma template directory path
 */
function getTemplatesPath(): string {
	// In the main plugma package, we need to reference the create-plugma templates
	// This assumes create-plugma is a sibling package
	const currentDir = dirname(fileURLToPath(import.meta.url));
	return path.join(currentDir, '..', '..', '..', 'create-plugma', 'templates');
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
	return !!(metadata.uiFrameworks && metadata.uiFrameworks.length > 0);
}

/**
 * Get available frameworks from examples
 */
function getAvailableFrameworks(examples: Example[]): string[] {
	const frameworks = new Set<string>();

	for (const example of examples) {
		if (example.metadata.uiFrameworks && !example.metadata.hidden) {
			const uiFrameworks = Array.isArray(example.metadata.uiFrameworks)
				? example.metadata.uiFrameworks
				: [example.metadata.uiFrameworks];

			for (const framework of uiFrameworks) {
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
			const uiFrameworks = Array.isArray(metadata.uiFrameworks)
				? metadata.uiFrameworks
				: metadata.uiFrameworks
					? [metadata.uiFrameworks]
					: [];

			if (!uiFrameworks.includes(framework)) return false;
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
 * Main init command implementation
 */
export async function init(options: InitCommandOptions): Promise<void> {
	const logger = createDebugAwareLogger(options.debug);

	// Handle specific template option
	if (options.template) {
		await createFromSpecificTemplate(options);
		return;
	}

	// Handle CLI flags for quick creation
	if (options.plugin || options.widget) {
		const type = options.plugin ? 'plugin' : 'widget';

		// Determine framework from various options
		let framework = options.framework || 'React';
		if (options.react) framework = 'React';
		if (options.svelte) framework = 'Svelte';
		if (options.vue) framework = 'Vue';

		const typescript = !options.noTypescript; // Default to true unless --no-typescript is specified

		// Create project with defaults
		await createProjectFromOptions({
			type,
			framework: options.noUi ? NO_UI_OPTION : framework,
			typescript,
			name: options.name || `my-${type}`,
			debug: options.debug || false,
		});

		return;
	}

	// Default behavior: use browse functionality
	await browseAndSelectTemplate(options);
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
async function browseAndSelectTemplate(options: InitCommandOptions): Promise<void> {
	try {
		const allExamples = getAvailableExamples();
		const visibleExamples = allExamples.filter((example) => !example.metadata.hidden);

		if (visibleExamples.length === 0) {
			outro(chalk.red('No templates available.'));
			process.exit(1);
		}

		// First, let user choose the type
		const availableTypes = Array.from(
			new Set(visibleExamples.map((example) => example.metadata.type).filter(Boolean)),
		).sort((a, b) => {
			// Ensure Plugin comes first
			if (a === 'plugin') return -1;
			if (b === 'plugin') return 1;
			return a!.localeCompare(b!);
		});

		if (availableTypes.length === 0) {
			outro(chalk.red('No valid template types found.'));
			process.exit(1);
		}

		let selectedType: string;
		try {
			selectedType = await select({
				message: 'Choose a type:',
				options: availableTypes.map((type) => ({
					label:
						type === 'plugin'
							? chalk.blue(`${type!.charAt(0).toUpperCase() + type!.slice(1)}`)
							: chalk.green(`${type!.charAt(0).toUpperCase() + type!.slice(1)}`),
					value: type,
				})),
			});
		} catch (error) {
			outro(chalk.gray('Operation cancelled.'));
			process.exit(0);
		}

		// Filter templates by selected type
		const typeFilteredExamples = visibleExamples.filter((example) => example.metadata.type === selectedType);

		if (typeFilteredExamples.length === 0) {
			outro(chalk.red(`No templates available for ${selectedType}.`));
			process.exit(1);
		}

		// Get available frameworks for this type
		const availableFrameworks = getAvailableFrameworks(typeFilteredExamples);
		const hasNoUIExamples = typeFilteredExamples.some((example) => !exampleHasUI(example.metadata));

		// Create framework options
		const frameworkOptions = [
			...availableFrameworks.map((framework) => ({
				label:
					framework.toLowerCase() === 'react'
						? chalk.red(`${framework.charAt(0).toUpperCase() + framework.slice(1)}`)
						: framework.toLowerCase() === 'svelte'
							? chalk.yellow(`${framework.charAt(0).toUpperCase() + framework.slice(1)}`)
							: framework.toLowerCase() === 'vue'
								? chalk.green(`${framework.charAt(0).toUpperCase() + framework.slice(1)}`)
								: chalk.white(framework.charAt(0).toUpperCase() + framework.slice(1)),
				value: framework,
			})),
			...(hasNoUIExamples
				? [
						{
							label: chalk.gray(`${NO_UI_OPTION}`),
							value: NO_UI_OPTION,
						},
					]
				: []),
		];

		let selectedFramework: string = 'React'; // default

		if (frameworkOptions.length > 1) {
			try {
				const frameworkChoice = await select({
					message: 'Choose a framework:',
					options: frameworkOptions,
				});
				selectedFramework = frameworkChoice as string;
			} catch (error) {
				outro(chalk.gray('Operation cancelled.'));
				process.exit(0);
			}
		} else if (frameworkOptions.length === 1) {
			selectedFramework = frameworkOptions[0].value;
		}

		// Filter templates by both type and framework preference
		const needsUI = selectedFramework !== NO_UI_OPTION;
		const filteredExamples = filterExamples(typeFilteredExamples, needsUI, selectedFramework);

		if (filteredExamples.length === 0) {
			outro(
				chalk.red(
					`No templates available for ${selectedType} with ${selectedFramework === NO_UI_OPTION ? 'no UI' : selectedFramework}.`,
				),
			);
			process.exit(1);
		}

		// Sort templates by rank
		const sortedExamples = filteredExamples.sort((a, b) => {
			const aRank = a.metadata.rank ?? 0;
			const bRank = b.metadata.rank ?? 0;
			return bRank - aRank;
		});

		// Create template options
		const templateOptions = sortedExamples.map((example) => {
			const displayName = getDisplayName(example);
			const description = example.metadata.description || 'No description';
			const frameworks = example.metadata.uiFrameworks
				? Array.isArray(example.metadata.uiFrameworks)
					? example.metadata.uiFrameworks.join(', ')
					: example.metadata.uiFrameworks
				: 'No UI';

			// Add color coding based on template type
			const type = example.metadata.type || 'plugin';
			const coloredLabel = type === 'plugin' ? chalk.blue(`${displayName}`) : chalk.green(`${displayName}`);

			return {
				label: coloredLabel,
				value: example,
				hint: `${description} (${frameworks})`,
			};
		});

		let selectedTemplate: Example;
		try {
			selectedTemplate = await select({
				message: `Choose a ${selectedType} template:`,
				options: templateOptions,
			});
		} catch (error) {
			outro(chalk.gray('Operation cancelled.'));
			process.exit(0);
		}

		// Get additional options - framework already selected above
		const templateNeedsUI = exampleHasUI((selectedTemplate as Example).metadata);

		// Framework was already selected above, no need to ask again
		// Just validate that the selected template supports the chosen framework
		if (templateNeedsUI && selectedFramework !== NO_UI_OPTION) {
			const availableFrameworks = getFrameworksForExample(selectedTemplate as Example);

			if (!availableFrameworks.includes(selectedFramework)) {
				outro(
					chalk.red(
						`Template "${getDisplayName(selectedTemplate as Example)}" does not support ${selectedFramework}.`,
					),
				);
				process.exit(1);
			}
		}

		let typescript: boolean;
		try {
			typescript = await confirm({
				message: 'Use TypeScript?',
				initialValue: true,
			});
		} catch (error) {
			outro(chalk.gray('Operation cancelled.'));
			process.exit(0);
		}

		// Generate project name
		const templateExample = selectedTemplate as Example;
		const exampleName = templateExample.metadata.name || templateExample.name;
		const normalizedExampleName = exampleName.toLowerCase().replace(/\s+/g, '-');
		const type = templateExample.metadata.type || 'plugin';
		const frameworkPart = needsUI ? `-${selectedFramework.toLowerCase()}` : '';
		const baseName = `${normalizedExampleName}${frameworkPart}-${type}`;

		let projectName: string;
		try {
			projectName = await text({
				message: `${type.charAt(0).toUpperCase() + type.slice(1)} name:`,
				defaultValue: options.name || baseName,
				validate: validateProjectName,
			});
		} catch (error) {
			outro(chalk.gray('Operation cancelled.'));
			process.exit(0);
		}

		// Create the project
		await createProjectFromOptions({
			type,
			framework: needsUI ? selectedFramework : NO_UI_OPTION,
			typescript,
			name: projectName,
			selectedExample: templateExample,
			debug: options.debug || false,
		});
	} catch (error) {
		outro(chalk.red('Error browsing templates: ' + (error instanceof Error ? error.message : String(error))));
		process.exit(1);
	}
}

/**
 * Create project from specific template name
 */
async function createFromSpecificTemplate(options: InitCommandOptions): Promise<void> {
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
				chalk.yellow('\nTip: Run "plugma init" without --template to see all templates interactively.'),
			);
			process.exit(1);
		}

		let selectedTemplate: Example;

		// Handle disambiguation if multiple templates match
		if (matchingTemplates.length > 1) {
			console.log(chalk.yellow(`Multiple templates found for "${templateName}":`));

			try {
				const templateChoice = await select({
					message: 'Which template do you want to use?',
					options: matchingTemplates.map((template) => {
						const displayName = getDisplayName(template);
						const type = template.metadata.type || 'unknown';
						const hasUI = exampleHasUI(template.metadata);
						const frameworks = template.metadata.uiFrameworks;

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

						// Color code the display name based on type
						const coloredDisplayName =
							type === 'plugin' ? chalk.blue(`${displayName}`) : chalk.green(`${displayName}`);

						// Color code the type info
						const coloredTypeInfo =
							type === 'plugin' ? chalk.blue(`[${typeInfo}]`) : chalk.green(`[${typeInfo}]`);

						const label = `${coloredDisplayName} ${coloredTypeInfo}`;

						return {
							label,
							value: template,
							hint: template.metadata.description || 'No description',
						};
					}),
				});
				selectedTemplate = templateChoice as Example;
			} catch (error) {
				outro(chalk.gray('Operation cancelled.'));
				process.exit(0);
			}
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
			if (!availableFrameworks.includes(framework)) {
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
		await createProjectFromOptions({
			type,
			framework,
			typescript,
			name: defaultName,
			selectedExample: selectedTemplate,
			debug: options.debug || false,
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
	const uiFrameworks = example.metadata.uiFrameworks;
	if (!uiFrameworks) return [];

	return Array.isArray(uiFrameworks) ? uiFrameworks : [uiFrameworks];
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
}): Promise<void> {
	const { type, framework, typescript, name, selectedExample, debug } = params;

	const s = spinner();
	s.start('Creating project...');

	try {
		const templatesPath = getTemplatesPath();
		const versions = getVersions();

		// Define output directory
		const destDir = path.join(CURR_DIR, name);
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

		// Clear spinner and show success message with next steps in a single box
		s.stop();

		const successMessage = [
			'Next steps:',
			`  ${chalk.cyan(`cd ${name}`)}`,
			`  ${chalk.cyan('npm install')}`,
			`  ${chalk.cyan('npm run dev')}`,
		].join('\n');

		console.log(
			createBox(successMessage, {
				type: 'success',
				title: 'Success',
			}),
		);
	} catch (error) {
		s.fail('Failed to create project');

		// Show error message in a nice box
		console.log(
			createBox(undefined, {
				type: 'error',
				title: 'Project Creation Error',
			}),
		);

		throw error;
	}
}
