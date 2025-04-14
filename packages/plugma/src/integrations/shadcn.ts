import { defineIntegration } from './define-integration.js'
import MagicString from 'magic-string'
import dedent from 'dedent'
import { text } from 'stream/consumers'

/**
 * 1. Create components.json file
 * 2. Add aliases to tsconfig file
 * 3. Install shadcn-ui
 *
 * @see https://ui.shadcn.com/docs/installation/nextjs
 */
export default defineIntegration({
	id: 'shadcn',
	name: 'Shadcn UI',
	description: 'UI components',

	// Add required integrations - this will ensure tailwind is set up first
	requires: ['tailwind'],

	questions: [
		{
			id: 'style',
			type: 'select',
			question: 'Which style would you like to use?',
			options: [
				{ value: 'default', label: 'Default', hint: 'Simple and clean' },
				{ value: 'new-york', label: 'New York', hint: 'Elegant and professional' },
			],
			default: 'default',
		},
		{
			id: 'baseColor',
			type: 'select',
			question: 'Which color would you like to use as base?',
			options: [
				{ value: 'slate', label: 'Slate' },
				{ value: 'zinc', label: 'Zinc' },
				{ value: 'neutral', label: 'Neutral' },
				{ value: 'gray', label: 'Gray' },
			],
			default: 'slate',
		},
	],

	devDependencies: ['shadcn-ui'],

	async setup({ answers, helpers, typescript }) {
		const ext = typescript ? 'ts' : 'js'

		// Create components.json file
		await helpers.writeFile(
			`components.json`,
			JSON.stringify(
				{
					$schema: 'https://ui.shadcn.com/schema.json',
					style: answers.style,
					rsc: false,
					tsx: false,
					tailwind: {
						config: '',
						css: 'src/styles.css',
						baseColor: answers.baseColor,
						cssVariables: true,
						prefix: '',
					},
					aliases: {
						components: '@/components',
						utils: '@/lib/utils',
						ui: '@/components/ui',
						lib: '@/lib',
						hooks: '@/hooks',
					},
					iconLibrary: 'lucide',
				},
				null,
				2,
			),
		)

		// Update tsconfig file
		if (typescript) {
			// Update existing config
			await helpers.updateJson('tsconfig.json', (json) => {
				json.compilerOptions = json.compilerOptions || {}
				json.compilerOptions.baseUrl = '.'
				json.compilerOptions.paths = {
					'@/*': ['./src/*'],
				}
			})
		}
	},

	nextSteps: () => dedent`
		Shadcn UI is now installed and configured!
		Add components using the Shadcn UI CLI:
		npx shadcn@latest add button
		Visit https://ui.shadcn.com/docs/components for available components
		Import components from "@/components/ui"
	`,
})
