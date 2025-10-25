import { FileHelpers, createFileHelpers } from '../utils/file-helpers.js';

export type QuestionType = 'select' | 'confirm' | 'text';

export interface BaseQuestion {
	id: string;
	question: string;
	shortLabel?: string;
	type: QuestionType;
	condition?: (answers: Record<string, any>) => boolean;
}

export interface SelectQuestion extends BaseQuestion {
	type: 'select';
	options: Array<{ value: string; label: string; hint?: string }>;
	default?: string;
}

export interface ConfirmQuestion extends BaseQuestion {
	type: 'confirm';
	default?: boolean;
}

export interface TextQuestion extends BaseQuestion {
	type: 'text';
	default?: string;
}

export type Question = SelectQuestion | ConfirmQuestion | TextQuestion;

export interface FileOperation {
	path: string;
	content: string | ((existingContent: string) => string);
}

export interface SetupContext {
	answers: Record<string, any>;
	helpers: FileHelpers;
	typescript: boolean;
}

export interface IntegrationTask {
	label: string;
	action: (context: SetupContext) => Promise<void>;
}

export interface Integration {
	id: string;
	name: string;
	description: string;
	questions?: Question[];
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	requires?: string[];
	requiresUI?: boolean;
	files?: FileOperation[];
	setup?: IntegrationTask[];
	postSetup?: IntegrationTask[];
	nextSteps?: (answers: Record<string, any>) => string | string[];
}

export function defineIntegration(integration: Integration): Integration {
	return integration;
}

interface RunIntegrationOptions {
	name: string;
	prefixPrompts?: boolean;
	providedAnswers?: Record<string, any>;
}

export async function runIntegration(integration: Integration, options?: RunIntegrationOptions) {
	// Use provided answers if available
	const answers: Record<string, any> = options?.providedAnswers || {};

	// Get setup tasks from integration (they're now just an array, not a function)
	const tasks: IntegrationTask[] = integration.setup || [];

	return {
		answers,
		dependencies: integration.dependencies || {},
		devDependencies: integration.devDependencies || {},
		files: integration.files || [],
		nextSteps: integration.nextSteps?.(answers) || [],
		tasks,
	};
}
