#!/usr/bin/env node

import { Combino } from 'combino'
import enquirer from 'enquirer'
const { Select, Confirm, Input, Toggle } = enquirer
import * as fs from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import path from 'path'

import chalk from 'chalk'
import stripTS from '@combino/plugin-strip-ts'
import ejsMate from '@combino/plugin-ejs-mate'
import versions from '../versions.json' with { type: 'json' }

const CURR_DIR = process.cwd()
const __dirname = dirname(fileURLToPath(import.meta.url))

// Constants
const NO_UI_OPTION = 'No UI'
const NO_UI_DESCRIPTION = 'no UI'
const NO_UI_HINT = 'No UI included'
const ANY_FRAMEWORK_OPTION = 'Any'

// Parse command line arguments
const args: string[] = process.argv.slice(2)
const debugFlag: boolean = args.includes('-d') || args.includes('--debug')

interface ExampleMetadata {
	name?: string
	uiFrameworks?: string[] | string
	type?: string
	description?: string
	hidden?: boolean
}

interface Example {
	name: string
	metadata: ExampleMetadata
}

interface TemplateData {
	name: string
	type: string
	language: string
	framework: string
	example: string
	typescript: boolean
	hasUI: boolean
	description: string
}

// Helper function to clear directory if it exists
const clearDirectory = (dirPath: string): void => {
	if (fs.existsSync(dirPath)) {
		fs.rmSync(dirPath, { recursive: true, force: true })
		console.log(`Cleared existing directory: ${dirPath}`)
	}
}

// Helper function to validate project name
const validateProjectName = (input: string): string | boolean => {
	const valid = /^[a-zA-Z0-9_-]+$/.test(input)
	if (!valid) {
		return 'Project name can only include letters, numbers, underscores, and hyphens.'
	}
	const destDir = path.join(process.cwd(), input)
	if (fs.existsSync(destDir)) {
		return `Directory "${input}" already exists. Please choose a different name.`
	}
	return true
}

// Helper function to determine if an example has a UI based on uiFrameworks
const exampleHasUI = (metadata: ExampleMetadata): boolean => {
	if (!metadata.uiFrameworks) {
		return false
	}

	if (Array.isArray(metadata.uiFrameworks)) {
		return metadata.uiFrameworks.length > 0
	}

	if (typeof metadata.uiFrameworks === 'string') {
		return metadata.uiFrameworks.trim() !== ''
	}

	return false
}

// Helper function to parse combino.json metadata
const parseCombinoMetadata = (filePath: string): ExampleMetadata | null => {
	try {
		const content = fs.readFileSync(filePath, 'utf8')
		const parsed = JSON.parse(content)

		// Extract the meta section
		const metadata = parsed.meta || {}

		return metadata as ExampleMetadata
	} catch (error) {
		console.log(chalk.yellow(`Warning: Could not parse metadata from ${filePath}: ${(error as Error).message}`))
		return null
	}
}

// Helper function to get available examples based on metadata
const getAvailableExamples = (): Example[] => {
	const examplesDir = path.join(__dirname, '..', 'templates', 'examples')
	const examples: Example[] = []

	if (!fs.existsSync(examplesDir)) {
		return examples
	}

	const exampleDirs = fs
		.readdirSync(examplesDir, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name)

	exampleDirs.forEach((exampleName) => {
		const combinoPath = path.join(examplesDir, exampleName, 'template.json')
		if (fs.existsSync(combinoPath)) {
			// Read the raw combino.json file directly from filesystem
			// This avoids any template processing that might affect the metadata
			const metadata = parseCombinoMetadata(combinoPath)
			if (metadata) {
				examples.push({
					name: exampleName,
					metadata,
				})
			}
		}
	})

	return examples
}

// Helper function to filter examples based on user choices
const filterExamples = (examples: Example[], needsUI: boolean, framework: string): Example[] => {
	return examples.filter((example) => {
		const { metadata } = example

		// Skip hidden examples
		if (metadata.hidden === true) {
			return false
		}

		// Check if UI requirement matches
		const hasUI = exampleHasUI(metadata)
		if (hasUI !== needsUI) {
			return false
		}

		// Only check framework compatibility for examples with UI
		// Examples without UI don't need framework filtering
		// Skip framework filtering if "Any" is selected
		if (hasUI && metadata.uiFrameworks && framework !== ANY_FRAMEWORK_OPTION) {
			// Handle both array and string cases
			let frameworksArray = metadata.uiFrameworks
			if (typeof metadata.uiFrameworks === 'string') {
				// If it's an empty string, treat as no frameworks supported
				if (metadata.uiFrameworks.trim() === '') {
					return false
				}
				// Try to parse as array if it looks like one
				if (metadata.uiFrameworks.startsWith('[') && metadata.uiFrameworks.endsWith(']')) {
					frameworksArray = metadata.uiFrameworks
						.slice(1, -1)
						.split(',')
						.map((item) => item.trim())
				} else {
					// Single framework as string
					frameworksArray = [metadata.uiFrameworks.trim()]
				}
			}

			if (Array.isArray(frameworksArray)) {
				// If frameworks array is empty, it means no frameworks are supported
				if (frameworksArray.length === 0) {
					return false
				}
				// Check if the selected framework is in the supported list
				if (!frameworksArray.includes(framework.toLowerCase())) {
					return false
				}
			}
		}

		return true
	})
}

// Helper function to get all available types from examples (without filtering by framework/UI)
const getAllAvailableTypes = (examples: Example[]): string[] => {
	const types = new Set<string>()
	examples.forEach((example) => {
		const { metadata } = example
		// Skip hidden examples
		if (metadata.hidden === true) {
			return
		}
		// Add the type if it exists
		if (metadata.type) {
			types.add(metadata.type)
		}
	})
	return Array.from(types)
}

// Helper function to get available frameworks from examples
const getAvailableFrameworks = (examples: Example[]): string[] => {
	const frameworks = new Set<string>()

	examples.forEach((example) => {
		const { metadata } = example
		// Skip hidden examples
		if (metadata.hidden === true) {
			return
		}

		// Only process examples that have UI frameworks
		if (metadata.uiFrameworks) {
			if (Array.isArray(metadata.uiFrameworks)) {
				metadata.uiFrameworks.forEach((framework) => {
					if (framework.trim()) {
						frameworks.add(framework.trim().toLowerCase())
					}
				})
			} else if (typeof metadata.uiFrameworks === 'string') {
				const frameworkStr = metadata.uiFrameworks.trim()
				if (frameworkStr) {
					// Handle comma-separated frameworks in string format
					if (frameworkStr.includes(',')) {
						frameworkStr.split(',').forEach((framework) => {
							const trimmed = framework.trim()
							if (trimmed) {
								frameworks.add(trimmed.toLowerCase())
							}
						})
					} else {
						frameworks.add(frameworkStr.toLowerCase())
					}
				}
			}
		}
	})

	// Convert to array and capitalize first letter
	return Array.from(frameworks)
		.map((framework) => framework.charAt(0).toUpperCase() + framework.slice(1))
		.sort()
}

// Helper function to get available types from examples
const getAvailableTypes = (examples: Example[], needsUI: boolean, framework: string): string[] => {
	const types = new Set<string>()
	examples.forEach((example) => {
		const { metadata } = example
		// Skip hidden examples
		if (metadata.hidden === true) {
			return
		}
		// Only add the type if the example supports the selected framework and UI requirement
		const hasUI = exampleHasUI(metadata)
		if (hasUI === needsUI) {
			// For examples with UI, check framework compatibility
			if (hasUI && metadata.uiFrameworks) {
				// Handle both array and string cases
				let frameworksArray = metadata.uiFrameworks
				if (typeof metadata.uiFrameworks === 'string') {
					frameworksArray = [metadata.uiFrameworks.trim()]
				}

				if (Array.isArray(frameworksArray) && !frameworksArray.includes(framework.toLowerCase())) {
					return
				}
			}

			// Add the type if all conditions are met
			if (metadata.type) {
				types.add(metadata.type)
			}
		}
	})
	return Array.from(types)
}

async function main(): Promise<void> {
	// Get all available examples to determine available types and frameworks
	const allExamples = getAvailableExamples()

	// Get all available types first (without filtering by framework/UI)
	const allAvailableTypes = getAllAvailableTypes(allExamples)

	if (allAvailableTypes.length === 0) {
		console.log(chalk.red('No valid types found in available examples.'))
		process.exit(1)
	}

	// Sort types to ensure Plugin is always first
	const sortedTypes = allAvailableTypes.sort((a, b) => {
		if (a === 'plugin') return -1
		if (b === 'plugin') return 1
		return a.localeCompare(b)
	})

	const typePrompt = new Select({
		name: 'type',
		message: 'Choose a type:',
		choices: sortedTypes.map((type) => {
			const displayName = type.charAt(0).toUpperCase() + type.slice(1)
			// Use specific colors for Plugin and Widget
			const color = displayName === 'Plugin' ? chalk.blue : chalk.magenta
			return {
				message: color(displayName),
				value: displayName,
			}
		}),
	})

	const type: string = await typePrompt.run()

	// Filter examples by selected type first
	const typeFilteredExamples = allExamples.filter((example) => example.metadata.type === type.toLowerCase())

	if (typeFilteredExamples.length === 0) {
		console.log(chalk.red(`No examples available for ${type}.`))
		process.exit(1)
	}

	// Get available frameworks from type-filtered examples
	const availableFrameworks = getAvailableFrameworks(typeFilteredExamples)

	// Check if any examples in this type don't have UI (support "No UI" option)
	const hasNoUIExamples = typeFilteredExamples.some((example) => {
		const { metadata } = example
		if (metadata.hidden === true) return false
		return !exampleHasUI(metadata)
	})

	// Define colors for framework options (using available chalk colors)
	const colors = [chalk.green, chalk.yellow, chalk.red, chalk.gray, chalk.blue, chalk.magenta]

	const frameworkChoices = [
		...(hasNoUIExamples
			? [
					{
						message: chalk.gray(NO_UI_OPTION),
						value: NO_UI_OPTION,
					},
				]
			: []),
		...availableFrameworks.map((framework, index) => ({
			message: colors[index % colors.length](framework),
			value: framework,
		})),
		{
			message: chalk.blue(ANY_FRAMEWORK_OPTION),
			value: ANY_FRAMEWORK_OPTION,
		},
	]

	if (frameworkChoices.length === 0) {
		console.log(chalk.red('No frameworks available for the selected type.'))
		process.exit(1)
	}

	const frameworkPrompt = new Select({
		name: 'framework',
		message: 'Choose a framework:',
		choices: frameworkChoices,
	})
	const framework: string = await frameworkPrompt.run()

	// Determine if UI is needed based on framework selection
	const needsUI = framework !== NO_UI_OPTION

	// Filter examples based on user choices (type was already filtered above)
	const availableExamples = filterExamples(typeFilteredExamples, needsUI, framework)

	if (availableExamples.length === 0) {
		console.log(chalk.red('No examples available for the selected configuration.'))
		process.exit(1)
	}

	// Sort examples to prioritize "Widget Starter" or "Plugin Starter"
	const sortedExamples = availableExamples.sort((a, b) => {
		const getDisplayName = (example: Example) => {
			return (
				example.metadata.name ||
				example.name
					.split('-')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ')
			)
		}

		const aDisplayName = getDisplayName(a)
		const bDisplayName = getDisplayName(b)

		// Check if either is "Widget Starter" or "Plugin Starter"
		const aIsPriority = aDisplayName === 'Widget Starter' || aDisplayName === 'Plugin Starter'
		const bIsPriority = bDisplayName === 'Widget Starter' || bDisplayName === 'Plugin Starter'

		// If only one is priority, prioritize it
		if (aIsPriority && !bIsPriority) return -1
		if (!aIsPriority && bIsPriority) return 1

		// If both are priority or both are not priority, maintain original order
		return 0
	})

	const examplePrompt = new Select({
		name: 'example',
		message: 'Choose a starter:',
		choices: sortedExamples.map((example) => {
			const description = example.metadata.description || ''
			// Use metadata name if available, otherwise fallback to formatted folder name
			const displayName =
				example.metadata.name ||
				example.name
					.split('-')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ')

			return {
				message: displayName,
				value: displayName,
				hint: description,
			}
		}),
	})

	const example: string = await examplePrompt.run()

	// Find the original example by matching the display name
	const selectedExample = availableExamples.find((ex) => {
		const displayName =
			ex.metadata.name ||
			ex.name
				.split('-')
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ')
		return displayName === example
	})

	if (!selectedExample) {
		console.log(chalk.red('Selected example not found.'))
		process.exit(1)
	}

	const languagePrompt = new Toggle({
		name: 'typescript',
		message: 'Use TypeScript?',
		enabled: 'Yes',
		disabled: 'No',
		initial: true,
	})

	const typescript: boolean = await languagePrompt.run()

	// Generate base name using metadata name if available, otherwise use folder name
	const exampleName = selectedExample.metadata.name || selectedExample.name
	const normalizedExampleName = exampleName.toLowerCase().replace(/\s+/g, '-')

	// Generate base name (exclude framework if "No UI" is selected)
	const frameworkPart = framework === NO_UI_OPTION ? '' : `-${framework.toLowerCase()}`
	const baseName = `${normalizedExampleName}${frameworkPart}-${type.toLowerCase()}`

	// Add debug suffix if debug flag is enabled
	const nameSuffix = debugFlag ? (typescript ? '-ts' : '-js') : ''
	const initialName = baseName + nameSuffix

	const namePrompt = new Input({
		name: 'name',
		message: `${type.charAt(0).toUpperCase() + type.slice(1)} name:`,
		initial: initialName,
		validate: validateProjectName,
	})
	const name: string = await namePrompt.run()

	// Convert framework name to lowercase for file operations
	const frameworkLower = framework.toLowerCase()
	const languageLower = typescript ? 'typescript' : 'javascript'

	// Define the output directory
	const destDir = path.join(CURR_DIR, name)

	// Clear directory if it exists
	clearDirectory(destDir)

	// Prepare template paths based on user choices
	const templates: string[] = []

	// Add base template first (lowest priority)
	// templates.push(path.join(__dirname, '..', 'templates', 'base'))

	// Add example template first (base priority)
	const exampleTemplateDir = path.join(__dirname, '..', 'templates', 'examples', selectedExample.name)
	if (fs.existsSync(exampleTemplateDir)) {
		templates.push(exampleTemplateDir)
	}

	// Add framework-specific template after example (higher priority)
	if (needsUI && framework !== ANY_FRAMEWORK_OPTION) {
		const frameworkTemplateDir = path.join(__dirname, '..', 'templates', 'frameworks', frameworkLower)
		if (fs.existsSync(frameworkTemplateDir)) {
			templates.push(frameworkTemplateDir)
		}
	}

	// Add TypeScript template last (highest priority)
	if (typescript) {
		const typescriptTemplateDir = path.join(__dirname, '..', 'templates', 'typescript')
		if (fs.existsSync(typescriptTemplateDir)) {
			templates.push(typescriptTemplateDir)
		}
	}

	// Create context object for template processing
	const templateData: TemplateData = {
		name,
		type: type.toLowerCase(),
		language: languageLower,
		framework: frameworkLower,
		example: selectedExample.name.toLowerCase(),
		typescript,
		hasUI: needsUI,
		description: `A Figma ${type.toLowerCase()} with ${needsUI ? framework : NO_UI_DESCRIPTION} and ${typescript ? 'TypeScript' : 'JavaScript'}`,
	}

	// Initialize Combino
	const combino = new Combino()

	try {
		// Generate the project using Combino
		await combino.build({
			outputDir: destDir,
			include: templates,
			data: { ...templateData, versions },
			plugins: [ejsMate(), stripTS({ skip: typescript })],
			configFileName: 'template.json',
		})

		console.log(`\nNext steps:\n    cd ${name}\n    npm install\n    npm run dev`)
	} catch (error) {
		console.error('Error generating project:', error)
		process.exit(1)
	}
}

main().catch((err) => {
	if (err === '' || (err && err.isTtyError)) {
		// User exited the prompt (e.g., Ctrl+C or Esc)
		process.exit(0)
	}
	console.error(err)
	process.exit(1)
})
