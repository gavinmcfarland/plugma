import { multi, group, radio, confirm, text, note } from 'askeroo';
import { runIntegration } from '../integrations/define-integration.js';
import type { Integration } from '../integrations/define-integration.js';
import { createFileHelpers, type FileHelpers } from './file-helpers.js';

// Import integrations
import playwrightIntegration from '../integrations/playwright.js';
import prettierIntegration from '../integrations/prettier.js';
import tailwindIntegration from '../integrations/tailwind.js';
import shadcnIntegration from '../integrations/shadcn.js';
import vitestIntegration from '../integrations/vitest.js';
import eslintIntegration from '../integrations/eslint.js';

export const INTEGRATIONS = {
	prettier: prettierIntegration,
	tailwind: tailwindIntegration,
	shadcn: shadcnIntegration,
	eslint: eslintIntegration,
	vitest: vitestIntegration,
	playwright: playwrightIntegration,
} as const;

export type IntegrationKey = keyof typeof INTEGRATIONS;

export interface DependencyCollection {
	dependencies: Set<string>;
	devDependencies: Set<string>;
}

export interface IntegrationResult {
	integration: Integration;
	integrationResult: any;
	requiredIntegrationSetups: RequiredIntegrationResult[];
}

export interface RequiredIntegrationResult {
	integration: Integration;
	answers: Record<string, any>;
}

export interface IntegrationPrompterOptions {
	/**
	 * Pre-selected integration(s) from CLI flags
	 */
	preSelectedIntegration?: string | string[] | boolean;

	/**
	 * Show the "None" option (for create command)
	 */
	showNoneOption?: boolean;

	/**
	 * Require at least one integration to be selected (for add command)
	 */
	requireSelection?: boolean;

	/**
	 * Hint position for the multi-select prompt
	 */
	hintPosition?: 'inline' | 'inline-fixed';

	/**
	 * Framework selected by the user (used to filter UI-dependent integrations)
	 */
	framework?: string;

	/**
	 * Manifest data to check UI field for filtering integrations
	 */
	manifest?: { ui?: string };
}

export interface IntegrationPrompterResult {
	selectedIntegrations: string[];
	integrationAnswers: Record<string, Record<string, any>>;
	allDeps: DependencyCollection;
	allResults: IntegrationResult[];
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

/**
 * Handles setup of required integrations for a given integration
 */
async function setupRequiredIntegrations(
	integration: Integration,
	allDeps: DependencyCollection,
): Promise<RequiredIntegrationResult[]> {
	if (!integration.requires?.length) return [];

	// Check which required integrations are already set up
	const requiredIntegrations = integration.requires.map((id) => INTEGRATIONS[id as IntegrationKey]);
	const installationStatus = await Promise.all(
		integration.requires.map(async (id) => ({
			id,
			integration: INTEGRATIONS[id as IntegrationKey],
			isInstalled: await isIntegrationInstalled(id),
		})),
	);

	const needsSetup = installationStatus.filter((item) => !item.isInstalled);

	// If all required integrations are already set up, return early
	if (needsSetup.length === 0) {
		return [];
	}

	const setupResults: RequiredIntegrationResult[] = [];

	// Setup each required integration that needs setup (but don't run postSetup yet)
	for (const item of needsSetup) {
		const result = await runIntegration(item.integration, {
			name: item.integration.name,
			prefixPrompts: true,
		});

		if (result) {
			// Store the result for later postSetup execution
			setupResults.push({
				integration: item.integration,
				answers: result.answers,
			});

			// Collect dependencies from required integration
			Object.keys(result.dependencies).forEach((dep) => allDeps.dependencies.add(dep));
			Object.keys(result.devDependencies).forEach((dep) => allDeps.devDependencies.add(dep));
		}
	}

	return setupResults;
}

/**
 * Prompts the user to select integrations/add-ons and collects their answers
 */
export async function promptForIntegrations(
	options: IntegrationPrompterOptions = {},
): Promise<IntegrationPrompterResult> {
	const {
		preSelectedIntegration,
		showNoneOption = false,
		requireSelection = false,
		hintPosition,
		framework,
		manifest,
	} = options;

	// Filter integrations based on framework selection and manifest UI field
	const availableIntegrations = Object.entries(INTEGRATIONS).filter(([id, integration]) => {
		// If framework is "No UI" and integration requires UI, exclude it
		if (framework === 'No UI' && integration.requiresUI === true) {
			return false;
		}

		// If manifest has no UI field and integration requires UI, exclude it
		if (manifest && !manifest.ui && integration.requiresUI === true) {
			return false;
		}

		return true;
	});

	// Determine selected integrations
	let selectedIntegrations: string[] = [];

	if (preSelectedIntegration === false) {
		// Explicitly skipped (from --no-add flag)
		selectedIntegrations = [];
	} else if (typeof preSelectedIntegration === 'string') {
		// Single pre-selected integration (from CLI)
		// Check if the pre-selected integration is still available after filtering
		if (availableIntegrations.some(([id]) => id === preSelectedIntegration)) {
			selectedIntegrations = [preSelectedIntegration];
		}
	} else if (Array.isArray(preSelectedIntegration)) {
		// Multiple pre-selected integrations (from CLI)
		// Filter to only include available integrations
		selectedIntegrations = preSelectedIntegration.filter((id) =>
			availableIntegrations.some(([availableId]) => availableId === id),
		);
	} else if (preSelectedIntegration === undefined) {
		// No pre-selection, prompt the user
		const multiOptions: any = {
			label: 'Add integrations:',
			shortLabel: 'Integrations',
			options: availableIntegrations.map(([value, integration]) => ({
				value,
				label: integration.name,
				hint: integration.description,
			})),
		};

		// Add hint position if provided
		if (hintPosition) {
			multiOptions.hintPosition = hintPosition;
		}

		// Add none option if requested
		if (showNoneOption) {
			multiOptions.noneOption = { label: 'None' };
		}

		// Add validation if selection is required
		if (requireSelection) {
			multiOptions.onValidate = async (values: string[]) => {
				if (values.length === 0) {
					return 'Please select at least one add-on';
				}
				return null;
			};
		}

		selectedIntegrations = await multi(multiOptions);
	}

	// If no integrations selected, return early
	if (selectedIntegrations.length === 0) {
		return {
			selectedIntegrations: [],
			integrationAnswers: {},
			allDeps: {
				dependencies: new Set<string>(),
				devDependencies: new Set<string>(),
			},
			allResults: [],
		};
	}

	// Process each selected integration
	const integrations = selectedIntegrations.map((id) => INTEGRATIONS[id as IntegrationKey]);

	// Create collection for all dependencies
	const allDeps: DependencyCollection = {
		dependencies: new Set<string>(),
		devDependencies: new Set<string>(),
	};

	// Collect answers for integrations that have questions
	const integrationAnswers: Record<string, Record<string, any>> = {};

	// Ask questions for each integration that has them
	for (const integration of integrations) {
		if (integration.questions && integration.questions.length > 0) {
			const answers = await group(
				async () => {
					const questionAnswers: Record<string, any> = {};

					for (const question of integration.questions!) {
						if (question.condition && !question.condition(questionAnswers)) {
							continue;
						}

						let answer;
						switch (question.type) {
							case 'select':
								answer = await radio({
									label: question.question,
									shortLabel: question.shortLabel || question.id,
									options: question.options.map((opt) => ({
										value: opt.value,
										label: opt.label,
										hint: opt.hint,
									})),
									meta: {
										depth: 1,
										group: integration.name,
									},
								});
								break;
							case 'confirm':
								answer = await confirm({
									label: question.question,
									shortLabel: question.shortLabel || question.id,
									initialValue: question.default,
								});
								break;
							case 'text':
								answer = await text({
									label: question.question,
									shortLabel: question.shortLabel || question.id,
									initialValue: question.default || '',
								});
								break;
						}

						questionAnswers[question.id] = answer;
					}

					return questionAnswers;
				},
				{
					label: integration.name,
					flow: 'phased',
				},
			);

			integrationAnswers[integration.id] = answers;
		}
	}

	const allResults: IntegrationResult[] = [];

	// Process each selected integration with their collected answers
	for (const integration of integrations) {
		// Set up any required integrations first
		const requiredIntegrationSetups = await setupRequiredIntegrations(integration, allDeps);

		// Pass the collected answers to runIntegration
		const integrationResult = await runIntegration(integration, {
			name: integration.name,
			prefixPrompts: true,
			providedAnswers: integrationAnswers[integration.id] || {},
		});

		if (integrationResult) {
			// Add main integration dependencies to collection
			Object.keys(integrationResult.dependencies).forEach((dep) => allDeps.dependencies.add(dep));
			Object.keys(integrationResult.devDependencies).forEach((dep) => allDeps.devDependencies.add(dep));

			allResults.push({
				integration,
				integrationResult,
				requiredIntegrationSetups,
			});
		}
	}

	return {
		selectedIntegrations,
		integrationAnswers,
		allDeps,
		allResults,
	};
}
