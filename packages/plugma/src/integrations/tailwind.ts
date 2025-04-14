import dedent from 'dedent'
import { defineIntegration } from './define-integration.js'
import MagicString from 'magic-string'

/**
 * 1. Add import to styles.css file
 * 2. Add tailwindcss to vite.config.ts file
 * 3. Install tailwindcss and @tailwindcss/vite
 *
 * @see https://tailwindcss.com/docs/installation
 */

export default defineIntegration({
	id: 'tailwind',
	name: 'Tailwind CSS',
	description: 'CSS framework',

	questions: [
		{
			id: 'createCssFile',
			type: 'confirm',
			question: 'Create a base CSS file with Tailwind imports?',
			default: true,
		},
	],

	dependencies: ['tailwindcss', '@tailwindcss/vite'],

	async setup({ answers, helpers, typescript }) {
		const ext = typescript ? 'ts' : 'js'

		// Create base CSS file if requested
		await helpers.updateFile(`src/styles.css`, (content) => {
			if (!content) return dedent`@import "tailwindcss";`
			if (!content.includes('@import "tailwindcss"')) {
				return dedent`@import "tailwindcss";\n
${content}`
			}
			return content
		})

		// Update Vite config to use Tailwind
		await helpers.updateFile(`vite.config.${ext}`, (content) => {
			const s = new MagicString(content)

			// Add tailwind import if needed
			if (!content.includes('@tailwindcss/vite')) {
				// Find the last import
				const imports = [...content.matchAll(/import\s+.*?from\s+['"].*?['"];?/g)]
				const lastImport = imports[imports.length - 1]

				if (lastImport) {
					s.appendLeft(
						lastImport.index! + lastImport[0].length,
						"\nimport tailwindcss from '@tailwindcss/vite'",
					)
				} else {
					s.prepend("import tailwindcss from '@tailwindcss/vite'\n")
				}
			}

			// Add tailwind to plugins array
			const pluginsMatch = /plugins:\s*\[([\s\S]*?)\]/.exec(content)
			if (pluginsMatch) {
				const pluginsStart = pluginsMatch.index! + pluginsMatch[0].indexOf('[') + 1
				const pluginsEnd = pluginsMatch.index! + pluginsMatch[0].lastIndexOf(']')
				const existingPlugins = pluginsMatch[1]

				if (!existingPlugins.includes('tailwindcss')) {
					if (existingPlugins.trim() === '') {
						s.appendLeft(pluginsStart, 'tailwindcss()')
					} else {
						const needsComma = !existingPlugins.trim().endsWith(',')
						s.appendLeft(pluginsEnd, `${needsComma ? ', ' : ' '}tailwindcss()`)
					}
				}
			}

			return s.toString()
		})

		// // Update main CSS import if we created a CSS file
		// if (answers.createCssFile) {
		// 	await helpers.updateFile(`src/main.${ext}`, (content) => {
		// 		const s = new MagicString(content)

		// 		if (!content.includes('styles/tailwind.css')) {
		// 			s.prepend("import './styles/tailwind.css'\n")
		// 		}

		// 		return s.toString()
		// 	})
		// }
	},

	nextSteps: (answers) => dedent`
		Tailwind CSS is now installed and configured!
		${
			answers.createCssFile
				? 'The base Tailwind CSS file is at src/styles/tailwind.css'
				: `Import the Tailwind directives in your CSS:

		@tailwind base;
		@tailwind components;
		@tailwind utilities;`
		}

		Start using Tailwind classes in your HTML!
		Example: <div class="flex items-center justify-center">
	`,
})
