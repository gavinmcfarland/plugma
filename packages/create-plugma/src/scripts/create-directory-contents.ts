import slugify from 'slugify'
import * as fs from 'fs'
const CURR_DIR = process.cwd()
import _ from 'lodash'
import path from 'path'
import { dirname, resolve, join } from 'path'
import { fileURLToPath } from 'url'

// Simple template processing function
const processTemplate = (content: string, data: any): string => {
	// Configure lodash template settings
	_.templateSettings.interpolate = /<%-([\s\S]+?)%>/g // Unescaped output
	_.templateSettings.escape = /<%=([\s\S]+?)%>/g // Escaped output
	_.templateSettings.evaluate = /<%([\s\S]+?)%>/g

	const template = _.template(content)
	return template(data)
}

interface Versions {
	[key: string]: string
}

interface KDLNode {
	name: string
	values: any[]
	properties: Record<string, any>
	children: KDLNode[]
}

interface TemplateData {
	name: string
	id: string
	type: string
	framework: string
	language: string
	config: any
	plugin: {
		name: string
		id: string
		type: string
		framework: string
		language: string
	}
	manifest: {
		main: string
		ui: string
	}
	versions: Versions
}

const versionsPath = join(dirname(fileURLToPath(import.meta.url)), '../versions.json')
const versions: Versions = JSON.parse(fs.readFileSync(versionsPath, 'utf8'))

const __dirname = dirname(fileURLToPath(import.meta.url))

// Helper function to find UI file in a directory
const findUIFile = (dir: string): string | null => {
	const files = fs.readdirSync(dir)
	for (const file of files) {
		const fullPath = path.join(dir, file)
		const stat = fs.statSync(fullPath)

		if (stat.isDirectory()) {
			// Skip node_modules and other common directories
			if (['node_modules', '.git', 'dist'].includes(file)) continue

			const result = findUIFile(fullPath)
			if (result) return result
		} else if (file === 'ui.ts' || file === 'ui.js') {
			return fullPath
		}
	}
	return null
}

const createDirectoryContents = (templatePath: string, newProjectPath: string, context: TemplateData): void => {
	if (!fs.existsSync(templatePath)) {
		console.warn(`Template path ${templatePath} does not exist, skipping...`)
		return
	}

	// Find UI file and determine manifest paths
	let manifest = {
		main: 'index.js',
		ui: 'ui.js',
	}

	if (context.framework) {
		const examplePath = path.join(__dirname, '..', '..', 'templates', 'examples', context.framework, context.type)
		if (fs.existsSync(examplePath)) {
			const uiFile = findUIFile(examplePath)
			if (uiFile) {
				// Get relative path from example root
				const relativePath = path.relative(examplePath, uiFile)
				// Remove framework-specific directories (e.g., 'svelte', 'react', etc.)
				const cleanPath = relativePath
					.split(path.sep)
					.filter((part) => !['svelte', 'react', 'vue'].includes(part))
					.join(path.sep)

				manifest.ui = cleanPath
				manifest.main = cleanPath
			}
		}
	}

	const filesToCreate = fs.readdirSync(templatePath)

	filesToCreate.forEach((file) => {
		const origFilePath = `${templatePath}/${file}`
		const stats = fs.statSync(origFilePath)

		if (stats.isFile()) {
			let contents = fs.readFileSync(origFilePath, 'utf8')

			// Create template data from context
			const templateData: TemplateData = {
				...context,
				id: slugify(context.name),
				plugin: {
					name: context.name,
					id: slugify(context.name),
					type: context.type,
					framework: context.framework,
					language: context.language,
				},
				manifest,
				versions,
			}

			// Process template files
			if (
				file.endsWith('.template') ||
				file === 'manifest.json' ||
				file === 'package.json' ||
				file.toUpperCase() === 'README.MD'
			) {
				contents = processTemplate(contents, templateData)
			}

			// Create new file path
			const newFilePath = `${newProjectPath}/${file}`

			// Create directory if it doesn't exist
			if (!fs.existsSync(newProjectPath)) {
				fs.mkdirSync(newProjectPath, { recursive: true })
			}

			// Remove .template extension if it exists
			const finalPath = file.endsWith('.template') ? newFilePath.slice(0, -9) : newFilePath

			// Write the file
			fs.writeFileSync(finalPath, contents, 'utf8')
		} else if (stats.isDirectory()) {
			// Recursively create subdirectories
			const newDirPath = path.join(newProjectPath, file)
			createDirectoryContents(origFilePath, newDirPath, context)
		}
	})
}

export { createDirectoryContents }
