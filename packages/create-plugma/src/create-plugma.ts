#!/usr/bin/env node

import { Combino } from 'combino'
import enquirer from 'enquirer'
const { Select, Confirm, Input, Toggle } = enquirer
import * as fs from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import path from 'path'

import chalk from 'chalk'
import stripTS from 'combino/plugins/strip-ts'
import ejsMate from 'combino/plugins/ejs-mate'
import versions from '../versions.json' with { type: 'json' }

const CURR_DIR = process.cwd()
const __dirname = dirname(fileURLToPath(import.meta.url))

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
	needsUI: boolean
	description: string
}

interface FileProcessContext {
	targetPath: string
	content: string
	data: TemplateData
}

interface ProcessedFile {
	content: string
	targetPath: string
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
		if (hasUI && metadata.uiFrameworks) {
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

// Helper function to get all available frameworks from examples
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
	const uiPrompt = new Toggle({
		name: 'needsUI',
		message: 'Do you need a UI?',
		enabled: 'Yes',
		disabled: 'No',
		initial: true,
	})

	const needsUI: boolean = await uiPrompt.run()

	// Get all available examples to determine available frameworks and filter later
	const allExamples = getAvailableExamples()

	let framework = 'Vanilla' // Default framework
	if (needsUI) {
		const availableFrameworks = getAvailableFrameworks(allExamples)

		if (availableFrameworks.length === 0) {
			console.log(chalk.red('No UI frameworks available in examples.'))
			process.exit(1)
		}

		const frameworkPrompt = new Select({
			name: 'framework',
			message: 'Choose a framework:',
			choices: availableFrameworks,
		})
		framework = await frameworkPrompt.run()
	}

	// Filter examples based on user choices (allExamples was already loaded above)
	const availableExamples = filterExamples(allExamples, needsUI, framework)

	if (availableExamples.length === 0) {
		console.log(chalk.red('No examples available for the selected configuration.'))
		process.exit(1)
	}

	// Get available types from filtered examples (with stricter filtering)
	const availableTypes = getAvailableTypes(availableExamples, needsUI, framework)

	if (availableTypes.length === 0) {
		console.log(chalk.red('No valid types found in available examples.'))
		process.exit(1)
	}

	const typePrompt = new Select({
		name: 'type',
		message: 'Create plugin or widget?',
		choices: availableTypes.map((type) => type.charAt(0).toUpperCase() + type.slice(1)),
	})

	const type: string = await typePrompt.run()

	// Filter examples by selected type
	const typeFilteredExamples = availableExamples.filter((example) => example.metadata.type === type.toLowerCase())

	if (typeFilteredExamples.length === 0) {
		console.log(chalk.red(`No examples available for ${type} with the selected configuration.`))
		process.exit(1)
	}

	const examplePrompt = new Select({
		name: 'example',
		message: 'Select an example:',
		choices: typeFilteredExamples.map((example) => {
			const description = example.metadata.description || ''
			// Use metadata name if available, otherwise fallback to formatted folder name
			const displayName =
				example.metadata.name || example.name.charAt(0).toUpperCase() + example.name.slice(1).replace(/-/g, ' ')
			return {
				message: displayName,
				value: example.name,
				hint: description,
			}
		}),
	})

	const example: string = await examplePrompt.run()
	const selectedExample = typeFilteredExamples.find((ex) => ex.name === example)

	if (!selectedExample) {
		console.log(chalk.red('Selected example not found.'))
		process.exit(1)
	}

	const languagePrompt = new Confirm({
		name: 'typescript',
		message: 'Include TypeScript?',
		initial: true,
	})

	const typescript: boolean = await languagePrompt.run()

	// Generate base name
	const baseName = `${selectedExample.name.toLowerCase()}-${framework.toLowerCase()}-${type.toLowerCase()}`

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
	if (needsUI) {
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
		needsUI,
		description: `A Figma ${type.toLowerCase()} with ${needsUI ? framework : 'no UI'} and ${typescript ? 'TypeScript' : 'JavaScript'}`,
	}

	// Initialize Combino
	const combino = new Combino()

	try {
		// Generate the project using Combino
		await combino.combine({
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
