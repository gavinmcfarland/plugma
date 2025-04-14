/**
 * Add new intergrations to Plugma
 */

import { Logger } from '#utils/log/logger.js'
import { exec } from 'child_process'
import { detect } from 'package-manager-detector/detect'
import { resolveCommand } from 'package-manager-detector/commands'
import { select, confirm, intro, outro, isCancel, spinner, log } from '@clack/prompts'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import MagicString from 'magic-string'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface AddCommandOptions {
	integration?: string
	debug?: boolean
	createExamples?: boolean
	installDependencies?: boolean
}

interface IntegrationConfig {
	initFunction?: () => Promise<void>
	examples?: () => Promise<void>
	dependencies?: string[]
	tsSupport?: boolean
}

interface CopyOptions {
	convertTS?: boolean
}

async function copyWithDirCheck(src: string, dest: string, options?: CopyOptions): Promise<void> {
	const dir = path.dirname(dest)
	await fs.mkdir(dir, { recursive: true })

	const isTS = await isTypeScriptProject()

	// If project is not TypeScript and destination ends with .ts, change it to .js
	if (!isTS && dest.endsWith('.ts')) {
		dest = dest.replace(/\.ts$/, '.js')
	}

	// Check if source file has .ts extension and project is not TypeScript
	if (src.endsWith('.ts') && !isTS) {
		// Replace .ts with .js in source path
		const jsSrc = src.replace(/\.ts$/, '.js')
		try {
			// Try to copy the .js version if it exists
			await fs.copyFile(jsSrc, dest)
			return
		} catch {
			// If .js version doesn't exist, continue with original .ts file
		}
	}

	await fs.copyFile(src, dest)
}

async function isTypeScriptProject(): Promise<boolean> {
	try {
		// Check for tsconfig.json
		await fs.access(path.join(process.cwd(), 'tsconfig.json'))
		return true
	} catch {
		return false
	}
}

const INTEGRATION_CONFIGS: Record<string, IntegrationConfig> = {
	playwright: {
		initFunction: async () => {
			const isTS = await isTypeScriptProject()
			const configFile = 'init-config.ts'
			const destPath = path.join(process.cwd(), `playwright.config.${isTS ? 'ts' : 'js'}`)
			const sourcePath = path.join(__dirname, `../../templates/playwright/${configFile}`)

			await copyWithDirCheck(sourcePath, destPath, { convertTS: true })
		},
		examples: async () => {
			console.log('Adding examples...')
			const isTS = await isTypeScriptProject()
			const testFile = 'create-rectangles.test.ts'
			const destPath = path.join(process.cwd(), `e2e/create-rectangles.test.${isTS ? 'ts' : 'js'}`)
			const sourcePath = path.join(__dirname, `../../templates/playwright/${testFile}`)

			await copyWithDirCheck(sourcePath, destPath, { convertTS: true })
		},
		dependencies: ['@playwright/test'],
		tsSupport: true,
	},
	tailwind: {
		initFunction: async () => {
			const viteConfigPath = path.join(process.cwd(), 'vite.config.js')
			const viteConfigTsPath = path.join(process.cwd(), 'vite.config.ts')
			let viteConfigContent = ''

			try {
				await fs.access(viteConfigPath)
				viteConfigContent = await fs.readFile(viteConfigPath, 'utf8')
			} catch {
				try {
					await fs.access(viteConfigTsPath)
					viteConfigContent = await fs.readFile(viteConfigTsPath, 'utf8')
				} catch {
					console.error('No vite.config.js or vite.config.ts file found.')
					return
				}
			}

			const s = new MagicString(viteConfigContent)

			// Helper function to find the last import statement
			const findLastImport = () => {
				const importMatch = /import\s+.*?from\s+['"].*?['"];?/g
				const imports = [...viteConfigContent.matchAll(importMatch)]
				return imports.pop()
			}

			// Helper function to check if tailwind is already imported
			const hasTailwindImport = () => {
				const importMatch = /import\s+.*?from\s+['"].*?['"];?/g
				const imports = [...viteConfigContent.matchAll(importMatch)]
				return imports.some((imp) => imp[0].includes('tailwindcss') && imp[0].includes('@tailwindcss/vite'))
			}

			// Add import if needed
			if (!hasTailwindImport()) {
				const lastImport = findLastImport()
				if (lastImport) {
					s.appendLeft(
						lastImport.index + lastImport[0].length,
						"\nimport tailwindcss from '@tailwindcss/vite';",
					)
				} else {
					s.prepend("import tailwindcss from '@tailwindcss/vite';\n")
				}
			}

			// Helper function to find and modify plugins array
			const updatePlugins = () => {
				const pluginsMatch = /plugins:\s*\[([\s\S]*?)\]/.exec(viteConfigContent)
				if (!pluginsMatch) return

				const pluginsStart = pluginsMatch.index + pluginsMatch[0].indexOf('[') + 1
				const pluginsEnd = pluginsMatch.index + pluginsMatch[0].lastIndexOf(']')
				const existingPlugins = pluginsMatch[1]

				if (existingPlugins.includes('tailwindcss(')) {
					console.log('Tailwind CSS is already configured in your Vite config')
					return
				}

				if (existingPlugins.trim() === '') {
					s.appendLeft(pluginsStart, 'tailwindcss()')
				} else {
					const needsComma = !existingPlugins.trim().endsWith(',')
					s.appendLeft(pluginsEnd, `${needsComma ? ', ' : ' '}tailwindcss()`)
				}
			}

			updatePlugins()
			await fs.writeFile(viteConfigPath, s.toString(), 'utf8')
			console.log('Vite configuration updated to support Tailwind CSS.')
		},
		// examples: async () => {
		// 	console.log('Adding examples...')
		// 	await import('../integrations/init-tailwind-examples.js').then((config) => {
		// 		config.initConfig()
		// 	})
		// },
		dependencies: ['tailwindcss', '@tailwindcss/vite'],
	},
	// vitest: {
	// 	initFunction: async () => {
	// 		await import('../integrations/init-vitest-config.js').then((config) => {
	// 			config.initConfig()
	// 		})
	// 	},
	// 	examples: async () => {
	// 		console.log('Adding examples...')
	// 		await import('../integrations/init-vitest-examples.js').then((config) => {
	// 			config.initConfig()
	// 		})
	// 	},
	// 	dependencies: ['vitest'],
	// },
	// shadcn: {
	// 	initFunction: async () => {
	// 		await import('../integrations/init-shadcn-config.js').then((config) => {
	// 			config.initConfig()
	// 		})
	// 	},
	// 	examples: async () => {
	// 		console.log('Adding examples...')
	// 		await import('../integrations/init-vitest-examples.js').then((config) => {
	// 			config.initConfig()
	// 		})
	// 	},
	// 	dependencies: ['shadcn-ui'],
	// },
	// Add more integrations here following the same pattern
}

export async function add(options: AddCommandOptions): Promise<void> {
	const log = new Logger({ debug: options.debug })

	try {
		log.info('Adding a new integration...')

		const integration = options.integration

		intro('Adding integration to your project')

		// Question 1: Integration selection
		const selectedIntegration = await select({
			message: 'What would you like to add?',
			options: [
				{ value: 'playwright', label: 'Playwright' },
				{ value: 'vitest', label: 'Vitest' },
				{ value: 'tailwind', label: 'Tailwind CSS' },
				{ value: 'shadcn-ui', label: 'Shadcn UI' },
				{ value: 'eslint', label: 'ESLint' },
				{ value: 'other', label: 'Other Integration' },
			],
			initialValue: integration,
		})

		if (isCancel(selectedIntegration)) {
			outro('Operation cancelled')
			process.exit(0)
		}

		// Initialize the integration
		try {
			await initIntegration(selectedIntegration)
		} catch (error) {
			console.error('Error initializing integration:', error)
			process.exit(1)
		}

		// Question 2: Test examples (only for Playwright)
		let createExamples = false
		if (selectedIntegration === 'playwright') {
			const testExamplesAnswer = await confirm({
				message: 'Create test examples?',
				initialValue: true,
			})

			if (isCancel(testExamplesAnswer)) {
				outro('Operation cancelled')
				process.exit(0)
			}

			if (testExamplesAnswer) {
				await addExamples(selectedIntegration)
			}
		}

		// Question 3: Install dependencies
		const installDeps = await confirm({
			message: 'Install dependencies?',
			initialValue: true,
		})

		if (isCancel(installDeps)) {
			outro('Operation cancelled')
			process.exit(0)
		}

		// Start the integration process
		try {
			// If user wants to install dependencies, do it now
			if (installDeps) {
				const s = spinner()
				s.start('Installing dependencies...')
				try {
					await installDependencies(selectedIntegration)
					s.stop('Dependencies installed successfully!')
				} catch (error) {
					s.stop('Failed to install dependencies', 1)
					throw error
				}
			}

			outro('Integration added successfully!')
		} catch (error) {
			console.error('Error adding integration:', error)
			process.exit(1)
		}

		if (!integration) {
			throw new Error('Integration is required')
		}

		const config = INTEGRATION_CONFIGS[integration]
		if (!config) {
			throw new Error(`Unsupported integration: ${integration}`)
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		log.error('Failed to add a new integration:', errorMessage)
		throw error
	}
}

export async function initIntegration(integration: string) {
	const config = INTEGRATION_CONFIGS[integration]
	if (!config || !config.initFunction) {
		throw new Error(`No initialization configured for integration: ${integration}`)
	}

	await config.initFunction()
}

export async function addExamples(integration: string) {
	const config = INTEGRATION_CONFIGS[integration]
	if (!config || !config.examples) {
		throw new Error(`No examples configured for integration: ${integration}`)
	}

	await config.examples()
}

export async function installDependencies(integration: string): Promise<void> {
	const config = INTEGRATION_CONFIGS[integration]
	if (!config) {
		throw new Error(`No dependencies configured for integration: ${integration}`)
	}

	const pm = await detect({ cwd: process.cwd() })
	if (!pm) throw new Error('Could not detect package manager')

	return new Promise((resolve, reject) => {
		const resolved = resolveCommand(pm.agent, 'add', config.dependencies || [])
		if (!resolved) throw new Error('Could not resolve package manager command')
		exec(`${resolved.command} ${resolved.args.join(' ')}`, (error) => {
			if (error) {
				reject(error)
			} else {
				resolve()
			}
		})
	})
}
