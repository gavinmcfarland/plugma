import type { Task } from 'askeroo';
import type { IntegrationResult } from './integration-prompter.js';
import { createFileHelpers } from './file-helpers.js';

export interface IntegrationTaskOptions {
	/**
	 * Integration results from promptForIntegrations
	 */
	integrationResults: IntegrationResult[];

	/**
	 * Optional directory to change to before running setup
	 */
	workingDirectory?: string;

	/**
	 * Optional array to collect integration results for postSetup execution
	 */
	collectResults?: Array<{ integration: any; answers: Record<string, any> }>;
}

export interface PostSetupTaskOptions {
	/**
	 * Integration results from promptForIntegrations
	 */
	integrationResults: IntegrationResult[];
}

/**
 * Creates a task object for setting up integrations
 * This is used by both the add and create commands
 *
 * Note: Integrations now define setup as an array of tasks (not a function).
 * Each task receives context (answers, helpers, typescript) when executed.
 */
export function createIntegrationSetupTask(options: IntegrationTaskOptions): Task | null {
	const { integrationResults, workingDirectory, collectResults } = options;

	// Return null if there are no integrations to set up
	if (integrationResults.length === 0) {
		return null;
	}

	return {
		label: 'Integrating chosen add-ons',
		action: async () => {},
		concurrent: false,
		tasks: integrationResults.map((result) => {
			const task: any = {
				label: result.integration.name,
				action: async () => {
					// Change to working directory if specified
					if (workingDirectory) {
						process.chdir(workingDirectory);
					}

					// Collect results for postSetup if array provided
					if (collectResults) {
						collectResults.push({
							integration: result.integration,
							answers: result.integrationResult.answers,
						});
					}
				},
			};

			// If the integration has setup tasks, convert them to askeroo tasks
			if (result.integrationResult.tasks && result.integrationResult.tasks.length > 0) {
				task.concurrent = false;
				task.tasks = result.integrationResult.tasks.map((integrationTask) => ({
					label: integrationTask.label,
					dimmed: true,
					action: async () => {
						// Create context for the task
						const helpers = createFileHelpers();
						const typescript = await helpers.detectTypeScript();

						// Execute the integration task with context
						await integrationTask.action({
							answers: result.integrationResult.answers,
							helpers,
							typescript,
						});
					},
				}));
			}

			return task;
		}),
	};
}

/**
 * Creates a task object for postSetup phase (runs after dependencies are installed)
 * This is used by both the add and create commands
 */
export function createPostSetupTask(options: PostSetupTaskOptions): Task | null {
	const { integrationResults } = options;

	// Filter integrations that have postSetup tasks
	const integrationsWithPostSetup = integrationResults.filter((result) => {
		// Check main integration
		const hasMainPostSetup = result.integration.postSetup && result.integration.postSetup.length > 0;
		// Check required integrations
		const hasRequiredPostSetup = result.requiredIntegrationSetups.some(
			(r) => r.integration.postSetup && r.integration.postSetup.length > 0,
		);
		return hasMainPostSetup || hasRequiredPostSetup;
	});

	// Return null if no integrations have postSetup
	if (integrationsWithPostSetup.length === 0) {
		return null;
	}

	return {
		label: 'Finalizing setup',
		action: async () => {},
		concurrent: false,
		tasks: integrationsWithPostSetup.flatMap((result) => {
			const postSetupTasks: Task[] = [];

			// Process required integrations postSetup first
			for (const requiredResult of result.requiredIntegrationSetups) {
				if (requiredResult.integration.postSetup && requiredResult.integration.postSetup.length > 0) {
					postSetupTasks.push({
						label: `Finalizing ${requiredResult.integration.name}`,
						action: async () => {},
						concurrent: false,
						tasks: requiredResult.integration.postSetup!.map((integrationTask) => ({
							label: integrationTask.label,
							action: async () => {
								// Create context for the task
								const helpers = createFileHelpers();
								const typescript = await helpers.detectTypeScript();

								// Execute the integration task with context
								await integrationTask.action({
									answers: requiredResult.answers,
									helpers,
									typescript,
								});
							},
						})),
					});
				}
			}

			// Process main integration postSetup
			if (result.integration.postSetup && result.integration.postSetup.length > 0) {
				postSetupTasks.push({
					label: `Finalizing ${result.integration.name}`,
					action: async () => {},
					concurrent: false,
					tasks: result.integration.postSetup!.map((integrationTask) => ({
						label: integrationTask.label,
						action: async () => {
							// Create context for the task
							const helpers = createFileHelpers();
							const typescript = await helpers.detectTypeScript();

							// Execute the integration task with context
							await integrationTask.action({
								answers: result.integrationResult.answers,
								helpers,
								typescript,
							});
						},
					})),
				});
			}

			return postSetupTasks;
		}),
	};
}
