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
import { createIntegrationSetupTask, createPostSetupTask } from './utils/integration-task-builder.js';

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
			const integrationTask = createIntegrationSetupTask({
				integrationResults: answers.allResults,
				verbose: options.verbose,
			});

			if (integrationTask) {
				setupTasksList.push(integrationTask);
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
				verbose: options.verbose,
			});

			// Add postSetup tasks (runs after dependency installation)
			const postSetupTask = createPostSetupTask({
				integrationResults: answers.allResults,
				verbose: options.verbose,
			});

			if (postSetupTask) {
				await tasks.add([postSetupTask]);
			}

			// Collect all next steps from all integrations
			// const allNextSteps: string[] = [];
			// for (const result of answers.allResults) {
			// 	if (result.integrationResult.nextSteps) {
			// 		const steps = Array.isArray(result.integrationResult.nextSteps)
			// 			? result.integrationResult.nextSteps
			// 			: [result.integrationResult.nextSteps];

			// 		if (answers.allResults.length > 1) {
			// 			// Add integration name if multiple integrations were installed
			// 			allNextSteps.push(`\n**${result.integration.name}:**`);
			// 		}
			// 		allNextSteps.push(...steps);
			// 	}
			// }

			// Show success message with next steps
			// if (allNextSteps.length > 0) {
			// 	const successMessage = allNextSteps.join('\n');
			// 	await note(successMessage);
			// }

			// Show completion message with optional dependency installation reminder
			let message = '';

			if ((depsArray.length > 0 || devDepsArray.length > 0) && packageManager === 'skip') {
				const installCommand =
					preferredPM === 'npm'
						? 'npm install'
						: preferredPM === 'yarn'
							? 'yarn'
							: preferredPM === 'pnpm'
								? 'pnpm install'
								: preferredPM === 'bun'
									? 'bun install'
									: preferredPM === 'deno'
										? 'deno install'
										: 'npm install';

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

				message = `**Integration added successfully!**\n\nTo complete the setup, install the required dependencies with \`${installCommand}\``;
			} else {
				message =
					"**All set!**\n\nYour integration has been added and dependencies are installed. You're ready to go!";
			}

			await note(message);
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
