import { select, confirm, text, isCancel } from '@clack/prompts'
import { FileHelpers, createFileHelpers } from '../utils/file-helpers.js'

export type QuestionType = 'select' | 'confirm' | 'text'

export interface BaseQuestion {
	id: string
	question: string
	type: QuestionType
	condition?: (answers: Record<string, any>) => boolean
}

export interface SelectQuestion extends BaseQuestion {
	type: 'select'
	options: Array<{ value: string; label: string; hint?: string }>
	default?: string
}

export interface ConfirmQuestion extends BaseQuestion {
	type: 'confirm'
	default?: boolean
}

export interface TextQuestion extends BaseQuestion {
	type: 'text'
	default?: string
}

export type Question = SelectQuestion | ConfirmQuestion | TextQuestion

export interface FileOperation {
	path: string
	content: string | ((existingContent: string) => string)
}

export interface SetupContext {
	answers: Record<string, any>
	helpers: FileHelpers
	typescript: boolean
}

export interface Integration {
	id: string
	name: string
	description: string
	questions?: Question[]
	dependencies?: string[]
	devDependencies?: string[]
	requires?: string[]
	files?: FileOperation[]
	setup?: (context: SetupContext) => Promise<void>
	nextSteps?: (answers: Record<string, any>) => string | string[]
}

export function defineIntegration(integration: Integration): Integration {
	return integration
}

async function askQuestions(questions: Question[], answers: Record<string, any> = {}) {
	for (const question of questions) {
		if (question.condition && !question.condition(answers)) {
			continue
		}

		let answer
		switch (question.type) {
			case 'select':
				answer = await select({
					message: question.question,
					options: question.options,
					initialValue: question.default,
				})
				break
			case 'confirm':
				answer = await confirm({
					message: question.question,
					initialValue: question.default,
				})
				break
			case 'text':
				answer = await text({
					message: question.question,
					initialValue: question.default,
				})
				break
		}

		if (isCancel(answer)) {
			return null
		}

		answers[question.id] = answer
	}

	return answers
}

export async function runIntegration(integration: Integration) {
	// Get answers to all questions
	const answers = integration.questions ? await askQuestions(integration.questions) : {}

	if (!answers) return null

	const helpers = createFileHelpers()
	const typescript = await helpers.detectTypeScript()

	// Run setup function if provided
	if (integration.setup) {
		await integration.setup({ answers, helpers, typescript })
	}

	return {
		answers,
		dependencies: integration.dependencies || [],
		devDependencies: integration.devDependencies || [],
		files: integration.files || [],
		nextSteps: integration.nextSteps?.(answers) || [],
	}
}
