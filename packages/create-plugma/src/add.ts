/**
 * Add new integrations to Plugma
 */

import { exec } from 'child_process';
import { detect } from 'package-manager-detector/detect';
import { resolveCommand } from 'package-manager-detector/commands';
import chalk from 'chalk';
import {
	ask,
	radio,
	multi,
	confirm,
	text,
	spinner as askerooSpinner,
	note,
	completedFields,
	group,
	tasks,
	type Task,
} from 'askeroo';
import { runIntegration, type Question } from './integrations/define-integration.js';
import { createFileHelpers, type FileHelpers } from './utils/file-helpers.js';
import playwrightIntegration from './integrations/playwright.js';
import tailwindIntegration from './integrations/tailwind.js';
import shadcnIntegration from './integrations/shadcn.js';
import type { Integration } from './integrations/define-integration.js';
import vitestIntegration from './integrations/vitest.js';
import eslintIntegration from './integrations/eslint.js';
import { AddCommandOptions } from './utils/create-options.js';
import { createSpinner, createBox } from './utils/cli/spinner.js';

// Helper to sleep
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Legacy spinner function for compatibility with existing code
function spinner() {
	return createSpinner();
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
			await note(
				`${integration.name} requires the following integrations:\n` +
					alreadyInstalled.map((item) => `  ✓ ${item.integration.name} (already installed)`).join('\n') +
					'\n' +
					needsInstallation.map((item) => `  • ${item.integration.name}`).join('\n'),
			);
		} else {
			await note(
				`${integration.name} requires the following integrations:\n` +
					needsInstallation.map((item) => `  • ${item.integration.name}`).join('\n'),
			);
		}
	} else {
		// If all required integrations are already installed, don't show any messages
		return [];
	}

	const shouldInstall = await confirm({
		label: `Would you like to install the missing integrations (${needsInstallation.map((item) => item.integration.name).join(', ')})?`,
		hideOnCompletion: true,
		initialValue: true,
	});

	if (!shouldInstall) {
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
	// Handle pre-selected integration validation
	if (options.integration) {
		if (!(options.integration in INTEGRATIONS)) {
			console.error(chalk.red(`Integration "${options.integration}" not found.`));
			console.log(chalk.yellow('Available integrations:'));
			for (const [key, integration] of Object.entries(INTEGRATIONS)) {
				console.log(`  ${chalk.green(key)} - ${integration.description}`);
			}
			process.exit(1);
		}
	}

	await ask(
		async () => {
			await completedFields();

			const answers = await group(
				async () => {
					// Select integration(s)
					const selectedIntegrations = options.integration
						? [options.integration]
						: await multi({
								label: 'Choose add-ons:',
								shortLabel: 'Add-ons',
								options: Object.entries(INTEGRATIONS).map(([value, integration]) => ({
									value,
									label: integration.name,
									hint: integration.description,
								})),
								onValidate: async (values) => {
									if (values.length === 0) {
										return 'Please select at least one add-on';
									}
									return null;
								},
							});

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

					const allResults: Array<{
						integration: Integration;
						integrationResult: any;
						requiredResults: RequiredIntegrationResult[];
					}> = [];

					// Process each selected integration with their collected answers
					for (const integration of integrations) {
						// Handle required integrations first
						const requiredResults = await installRequiredIntegrations(integration, allDeps);
						if (requiredResults === null) {
							process.exit(0);
						}

						// Pass the collected answers to runIntegration
						const integrationResult = await runIntegration(integration, {
							name: integration.name,
							prefixPrompts: true,
							providedAnswers: integrationAnswers[integration.id] || {},
						});

						if (!integrationResult) {
							process.exit(0);
						}

						// Add main integration dependencies to collection
						integrationResult.dependencies.forEach((dep) => allDeps.dependencies.add(dep));
						integrationResult.devDependencies.forEach((dep) => allDeps.devDependencies.add(dep));

						allResults.push({
							integration,
							integrationResult,
							requiredResults,
						});
					}

					return {
						allResults,
						allDeps,
					};
				},
				{ flow: 'phased', hideOnCompletion: true },
			);

			// Execute integration setup tasks BEFORE prompting for dependencies
			const setupTasksList: Task[] = [];

			// Add integration setup tasks
			if (answers.allResults.length > 0) {
				setupTasksList.push({
					label: 'Setting up integrations',
					action: async () => {},
					concurrent: true,
					tasks: answers.allResults.flatMap((result) => {
						// If the integration has custom tasks, use those
						if (result.integrationResult.tasks && result.integrationResult.tasks.length > 0) {
							return {
								label: result.integration.name,
								action: async () => {},
								concurrent: false,
								tasks: result.integrationResult.tasks,
							};
						}

						// For integrations without tasks, skip (they'll use postSetup later)
						return [];
					}),
				});
			}

			// Run setup tasks before prompting for dependencies
			if (setupTasksList.length > 0) {
				await tasks(setupTasksList, { concurrent: false });
			}

			// NOW prompt for dependency installation
			const depsArray = Array.from(answers.allDeps.dependencies) as string[];
			const devDepsArray = Array.from(answers.allDeps.devDependencies) as string[];

			// Detect preferred package manager
			const detectedPM = await detect({ cwd: process.cwd() });
			const preferredPM = detectedPM?.agent || 'npm';

			const packageManager =
				depsArray.length > 0 || devDepsArray.length > 0
					? await radio({
							label: 'Install dependencies?',
							shortLabel: 'Dependencies',
							initialValue: preferredPM,
							options: [
								{ value: 'skip', label: 'Skip' },
								{ value: 'npm', label: 'npm' },
								{ value: 'pnpm', label: 'pnpm' },
								{ value: 'yarn', label: 'yarn' },
								{ value: 'bun', label: 'bun' },
								{ value: 'deno', label: 'deno' },
							],
							hideOnCompletion: true,
						})
					: 'skip';

			// Build task list for dependency installation and postSetup
			const installTasksList: Task[] = [];

			// Add dependency installation task
			if (packageManager && packageManager !== 'skip') {
				installTasksList.push({
					label: `Installing dependencies with ${packageManager}`,
					action: async () => {
						await installDependencies(depsArray, devDepsArray, packageManager);
					},
				});
			}

			// Add postSetup tasks (runs after dependency installation)
			if (answers.allResults.length > 0) {
				const postSetupTasks = answers.allResults.flatMap((result) => {
					const helpers = createFileHelpers();

					// Check if this integration has postSetup or required integrations with postSetup
					const hasRequiredPostSetup = result.requiredResults.some((r) => r.integration.postSetup);
					const hasMainPostSetup = result.integration.postSetup;

					if (!hasRequiredPostSetup && !hasMainPostSetup) {
						return [];
					}

					return {
						label: `Finalizing ${result.integration.name}`,
						action: async () => {
							const typescript = await helpers.detectTypeScript();

							// Run postSetup for required integrations first
							for (const requiredResult of result.requiredResults) {
								if (requiredResult.integration.postSetup) {
									await requiredResult.integration.postSetup({
										answers: requiredResult.answers,
										helpers,
										typescript,
									});
								}
							}

							// Then run postSetup for the main integration
							if (result.integration.postSetup) {
								await result.integration.postSetup({
									answers: result.integrationResult.answers,
									helpers,
									typescript,
								});
							}
						},
					};
				});

				if (postSetupTasks.length > 0) {
					installTasksList.push({
						label: 'Finalizing setup',
						action: async () => {},
						concurrent: true,
						tasks: postSetupTasks,
					});
				}
			}

			// Run installation and postSetup tasks
			if (installTasksList.length > 0) {
				await tasks(installTasksList, { concurrent: false });
			}

			// Show info box if user skipped dependency installation
			if ((depsArray.length > 0 || devDepsArray.length > 0) && packageManager === 'skip') {
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

			// Collect all next steps from all integrations
			const allNextSteps: string[] = [];
			for (const result of answers.allResults) {
				if (result.integrationResult.nextSteps) {
					const steps = Array.isArray(result.integrationResult.nextSteps)
						? result.integrationResult.nextSteps
						: [result.integrationResult.nextSteps];

					if (answers.allResults.length > 1) {
						// Add integration name if multiple integrations were installed
						allNextSteps.push(`\n**${result.integration.name}:**`);
					}
					allNextSteps.push(...steps);
				}
			}

			// Show success message with next steps
			if (allNextSteps.length > 0) {
				const successMessage = allNextSteps.join('\n');
				await note(successMessage);
			}
		},
		{
			onCancel: async () => {
				const cancel = await askerooSpinner('Cancelling...', {
					color: 'yellow',
					hideOnCompletion: true,
				});

				await cancel.start();
				await sleep(800);
				await cancel.stop('Cancelled');
				process.exit(0);
			},
		},
	);
}

async function installDependencies(
	dependencies: string[],
	devDependencies: string[],
	packageManager: string,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const resolved = resolveCommand(packageManager as any, 'add', [...dependencies, ...devDependencies]);
		if (!resolved) throw new Error(`Could not resolve package manager command for ${packageManager}`);
		exec(`${resolved.command} ${resolved.args.join(' ')}`, (error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});
	});
}
