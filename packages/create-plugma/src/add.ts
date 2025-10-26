/**
 * Add new integrations to Plugma
 */

import { detect } from 'package-manager-detector/detect';
import chalk from 'chalk';
import { ask, spinner, note, completedFields, group, tasks, type Task } from 'askeroo';
import { AddCommandOptions } from './utils/create-options.js';
import { promptAndInstallDependencies } from './utils/dependency-installer.js';
import { promptForIntegrations, INTEGRATIONS } from './utils/integration-prompter.js';
import { createIntegrationSetupTask, createPostSetupTask } from './utils/integration-task-builder.js';
import { showCreatePlugmaPrompt } from './utils/show-prompt.js';
import { writeIntegrationNextSteps } from './utils/integration-next-steps.js';
import { getUserFiles } from './shared/index.js';

// Helper to sleep
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function add(options: AddCommandOptions): Promise<void> {
	// Handle pre-selected integration validation
	if (options.integration) {
		const integrationsToValidate = Array.isArray(options.integration) ? options.integration : [options.integration];
		const invalidIntegrations = integrationsToValidate.filter((integration) => !(integration in INTEGRATIONS));

		if (invalidIntegrations.length > 0) {
			console.error(chalk.red(`Integration(s) "${invalidIntegrations.join('", "')}" not found.`));
			console.log(chalk.yellow('Available integrations:'));
			for (const [key, integration] of Object.entries(INTEGRATIONS)) {
				console.log(`  ${chalk.green(key)} - ${integration.description}`);
			}
			process.exit(1);
		}
	}

	// Determine pre-selected install dependencies value from CLI flags
	let preSelectedInstall: boolean | undefined;
	if (options.noInstall !== undefined) {
		preSelectedInstall = !options.noInstall; // Convert --no-install to false
	}

	// Get manifest data to check UI field
	let manifest: { ui?: string } | undefined;
	try {
		const userFiles = await getUserFiles({ cwd: options.cwd });
		manifest = { ui: userFiles.manifest.ui };
	} catch (error) {
		// If no manifest is found, continue without manifest data
		// This allows the add command to work even without a manifest
	}

	await ask(
		async () => {
			await showCreatePlugmaPrompt();

			await completedFields();

			const answers = await group(
				async () => {
					const result = await promptForIntegrations({
						preSelectedIntegration: options.integration,
						showNoneOption: false,
						requireSelection: true,
						manifest,
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

			// Write next steps to INTEGRATIONS.md if there are any (before dependency installation)
			const hasNextSteps = await writeIntegrationNextSteps({
				integrationResults: answers.allResults,
				outputPath: 'INTEGRATIONS.md',
			});

			// Prompt for dependency installation
			const detectedPM = await detect({ cwd: process.cwd() });
			const preferredPM = detectedPM?.agent || 'npm';

			const { packageManager } = await promptAndInstallDependencies({
				skipInstallPrompt: preSelectedInstall === false || Boolean(options.install), // Skip prompt if --no-install or --install specified
				installDependencies: preSelectedInstall === undefined ? true : preSelectedInstall, // Install unless --no-install is used
				selectedPackageManager:
					preSelectedInstall !== false
						? typeof options.install === 'string'
							? options.install
							: options.install === true
								? preferredPM
								: null
						: null, // Use specified package manager or detected one when --install is used without package manager
				preferredPM,
				verbose: options.verbose,
				projectPath: process.cwd(),
			});

			// Add postSetup tasks (runs after dependency installation)
			const postSetupTask = createPostSetupTask({
				integrationResults: answers.allResults,
				verbose: options.verbose,
			});

			if (postSetupTask) {
				await tasks.add([postSetupTask]);
			}

			// Show completion message with optional dependency installation reminder
			let message = '';

			if (
				(depsArray.length > 0 || devDepsArray.length > 0) &&
				(packageManager === 'skip' || preSelectedInstall === false)
			) {
				const pmToUse = options.install || preferredPM;
				const installCommand =
					pmToUse === 'npm'
						? 'npm install'
						: pmToUse === 'yarn'
							? 'yarn'
							: pmToUse === 'pnpm'
								? 'pnpm install'
								: pmToUse === 'bun'
									? 'bun install'
									: pmToUse === 'deno'
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

			// Add information about INTEGRATIONS.md file if it was created
			if (hasNextSteps) {
				message += `\n${chalk.blue('See INTEGRATIONS.md on how to use them.')}`;
			}

			await note(message);
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
