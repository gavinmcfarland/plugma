/**
 * Add new integrations to Plugma
 */

import { exec } from 'child_process';
import { detect } from 'package-manager-detector/detect';
import { resolveCommand } from 'package-manager-detector/commands';
import chalk from 'chalk';
import { ask, spinner as askerooSpinner, note, completedFields, group, tasks, type Task } from 'askeroo';
import { createFileHelpers } from './utils/file-helpers.js';
import { AddCommandOptions } from './utils/create-options.js';
import { createSpinner } from './utils/cli/spinner.js';
import { promptAndInstallDependencies } from './utils/dependency-installer.js';
import { promptForIntegrations, INTEGRATIONS } from './utils/integration-prompter.js';

// Helper to sleep
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Legacy spinner function for compatibility with existing code
function spinner() {
	return createSpinner();
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
					const result = await promptForIntegrations({
						preSelectedIntegration: options.integration,
						showNoneOption: false,
						requireSelection: true,
					});

					return {
						allResults: result.allResults,
						allDeps: result.allDeps,
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

			// Run setup tasks and dynamically add dependency installation
			const depsArray = Array.from(answers.allDeps.dependencies) as string[];
			const devDepsArray = Array.from(answers.allDeps.devDependencies) as string[];

			// Start with setup tasks
			const tasksResult = await tasks(setupTasksList.length > 0 ? setupTasksList : [], { concurrent: false });

			// Prompt for dependency installation
			const detectedPM = await detect({ cwd: process.cwd() });
			const preferredPM = detectedPM?.agent || 'npm';

			const { packageManager } = await promptAndInstallDependencies({
				skipInstallPrompt: false,
				installDependencies: true,
				preferredPM,
				addonDependencies: depsArray,
				addonDevDependencies: devDepsArray,
			});

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
					await tasks.add([
						{
							label: 'Finalizing setup',
							action: async () => {},
							concurrent: true,
							tasks: postSetupTasks,
						},
					]);
				}
			}

			// Show note if user skipped dependency installation
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

				await note(`You can install the dependencies later by running:\n\n${dependencySections.join('\n\n')}`);
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
			// if (allNextSteps.length > 0) {
			// 	const successMessage = allNextSteps.join('\n');
			// 	await note(successMessage);
			// }
			await note(`All done!`);
		},
		{
			onCancel: async () => {
				const cancel = await askerooSpinner('Exiting...', {
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
