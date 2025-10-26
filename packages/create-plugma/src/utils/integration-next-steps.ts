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
 * Removes leading whitespace (tabs/spaces) from each line of text
 * Similar to dedent functionality
 */
function dedentText(text: string): string {
	if (!text) return text;

	const lines = text.split('\n');

	// Find the minimum leading whitespace (excluding empty lines)
	let minIndent = Infinity;
	for (const line of lines) {
		if (line.trim().length === 0) continue; // Skip empty lines
		const match = line.match(/^(\s*)/);
		if (match) {
			const indent = match[1].length;
			if (indent < minIndent) {
				minIndent = indent;
			}
		}
	}

	// If no indentation found, return as is (after trimming)
	if (minIndent === Infinity || minIndent === 0) {
		return text.trim();
	}

	// Remove the minimum indentation from each line and trim the result
	return lines
		.map((line) => line.slice(minIndent))
		.join('\n')
		.trim();
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
				// Dedent each step to remove leading whitespace
				const dedentedSteps = stepsArray.map((step) => dedentText(step));
				allNextSteps.push(...dedentedSteps);
			}
		}

		// Add next steps from main integration
		if (result.integrationResult?.nextSteps) {
			const steps = Array.isArray(result.integrationResult.nextSteps)
				? result.integrationResult.nextSteps
				: [result.integrationResult.nextSteps];
			// Dedent each step to remove leading whitespace
			const dedentedSteps = steps.map((step) => dedentText(step));
			allNextSteps.push(...dedentedSteps);
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
		// Join the steps and remove extra blank lines
		const content = allNextSteps
			.join('\n')
			.replace(/\n{3,}/g, '\n\n')
			.trim();
		const integrationsContent = `# Integrations\n\n${content}\n`;
		await fs.promises.writeFile(outputPath, integrationsContent);
		return true;
	}

	return false;
}
