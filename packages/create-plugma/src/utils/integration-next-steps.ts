import * as fs from 'node:fs';
import * as path from 'node:path';
import type { IntegrationResult } from './integration-prompter.js';

export interface CollectIntegrationNextStepsOptions {
	integrationResults: IntegrationResult[];
}

export interface WriteIntegrationNextStepsOptions extends CollectIntegrationNextStepsOptions {
	outputPath: string;
}

/**
 * Collects all next steps from integrations and their required integrations
 * @returns Array of next steps formatted as strings
 */
export function collectIntegrationNextSteps(options: CollectIntegrationNextStepsOptions): string[] {
	const { integrationResults } = options;
	const allNextSteps: string[] = [];

	for (const result of integrationResults) {
		// Check if we should add a section header for multiple integrations
		if (integrationResults.length > 1) {
			allNextSteps.push(`\n## ${result.integration.name}`);
		}

		// Add next steps from required integrations
		for (const requiredResult of result.requiredIntegrationSetups) {
			if (requiredResult.integration.nextSteps) {
				const steps =
					typeof requiredResult.integration.nextSteps === 'function'
						? requiredResult.integration.nextSteps(requiredResult.answers)
						: requiredResult.integration.nextSteps;
				const stepsArray = Array.isArray(steps) ? steps : [steps];
				allNextSteps.push(...stepsArray);
			}
		}

		// Add next steps from main integration
		if (result.integrationResult?.nextSteps) {
			const steps = Array.isArray(result.integrationResult.nextSteps)
				? result.integrationResult.nextSteps
				: [result.integrationResult.nextSteps];
			allNextSteps.push(...steps);
		}
	}

	return allNextSteps;
}

/**
 * Writes integration next steps to a markdown file
 * @returns true if there were next steps to write, false otherwise
 */
export async function writeIntegrationNextSteps(options: WriteIntegrationNextStepsOptions): Promise<boolean> {
	const { integrationResults, outputPath } = options;
	const allNextSteps = collectIntegrationNextSteps({ integrationResults });

	// Write next steps to INTEGRATIONS.md if there are any
	if (allNextSteps.length > 0) {
		const integrationsContent = `# Integrations Next Steps\n\n${allNextSteps.join('\n')}\n`;
		await fs.promises.writeFile(outputPath, integrationsContent);
		return true;
	}

	return false;
}
