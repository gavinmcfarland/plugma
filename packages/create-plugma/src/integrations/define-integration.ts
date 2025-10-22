// @ts-ignore - enquirer doesn't have types
import enquirer from 'enquirer';
// @ts-ignore - enquirer doesn't have types
const { Select, Toggle, Input } = enquirer;
import { FileHelpers, createFileHelpers } from '../utils/file-helpers.js';

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
	initialValue?: any;
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
		initial: options.initialValue,
	});

	try {
		const selectedLabel = await prompt.run();
		return labelToValue.get(selectedLabel);
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

async function text(options: {
	message: string;
	initialValue?: string;
	validate?: (value: string) => string | undefined;
}): Promise<string> {
	const prompt = new Input({
		name: 'value',
		message: options.message,
		initial: options.initialValue,
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
	// Use provided answers if available, otherwise ask questions (legacy behavior)
	let answers: Record<string, any> | null;

	if (options?.providedAnswers) {
		// Use answers that were already collected externally
		answers = options.providedAnswers;
	} else {
		// Legacy behavior: ask questions directly (for backward compatibility)
		answers = integration.questions
			? await askQuestions(integration.questions, {}, options?.prefixPrompts ? options.name : undefined)
			: {};
	}

	if (!answers) return null;

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

async function askQuestions(questions: Question[], answers: Record<string, any> = {}, prefixName?: string) {
	for (const question of questions) {
		if (question.condition && !question.condition(answers)) {
			continue;
		}

		const message = prefixName ? `[${prefixName}] ${question.question}` : question.question;

		let answer;
		switch (question.type) {
			case 'select':
				answer = await select({
					message,
					options: question.options,
					initialValue: question.default,
				});
				break;
			case 'confirm':
				answer = await confirm({
					message,
					initialValue: question.default,
				});
				break;
			case 'text':
				answer = await text({
					message,
					initialValue: question.default,
				});
				break;
		}

		if (isCancel(answer)) {
			return null;
		}

		answers[question.id] = answer;
	}

	return answers;
}
