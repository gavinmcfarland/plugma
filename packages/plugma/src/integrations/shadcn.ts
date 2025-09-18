import { defineIntegration } from './define-integration.js';
import MagicString from 'magic-string';
import dedent from 'dedent';
import chalk from 'chalk';
import { getUserFiles } from '../utils/get-user-files.js';
import { dirname, resolve, join } from 'node:path';
import { readFile } from 'node:fs/promises';

/**
 * Analyzes a file to find the first CSS import and returns the path
 */
async function findCssImportPath(filePath: string, cwd: string): Promise<string | null> {
	try {
		const content = await readFile(filePath, 'utf-8');

		// Look for CSS imports (both relative and absolute)
		const cssImportRegex = /import\s+['"]([^'"]*\.css)['"]/g;
		const match = cssImportRegex.exec(content);

		if (match) {
			const importPath = match[1];

			// If it's a relative import, resolve it relative to the UI file
			if (importPath.startsWith('.')) {
				const uiDir = dirname(filePath);
				const resolvedPath = resolve(uiDir, importPath);
				// Return the absolute path
				return resolvedPath;
			}

			// For absolute imports, just return the path
			return importPath;
		}

		return null;
	} catch (error) {
		// If we can't read the file, return null
		return null;
	}
}

/**
 * 1. Create components.json file
 * 2. Add aliases to tsconfig file
 * 3. Install shadcn-ui
 *
 * @see https://ui.shadcn.com/docs/installation/nextjs
 */
export default defineIntegration({
	id: 'shadcn',
	name: 'Shadcn/ui',
	description: 'UI components',

	// Add required integrations - this will ensure tailwind is set up first
	requires: ['tailwind'],

	questions: [
		{
			id: 'style',
			type: 'select',
			question: 'Choose a style:',
			options: [
				{ value: 'default', label: 'Default', hint: 'Simple and clean' },
				{ value: 'new-york', label: 'New York', hint: 'Elegant and professional' },
			],
			default: 'default',
		},
		{
			id: 'baseColor',
			type: 'select',
			question: 'Choose a base color:',
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
		const ext = typescript ? 'ts' : 'js';
		const cwd = process.cwd();

		// Get the UI directory and file from the manifest
		let uiDir = 'src';
		let uiFilePath: string | null = null;
		let cssFilePath: string | null = null;
		let manifestUiPath: string | null = null;

		try {
			const files = await getUserFiles({ cwd });
			if (files.manifest.ui) {
				uiDir = dirname(files.manifest.ui);
				uiFilePath = resolve(cwd, files.manifest.ui);
				manifestUiPath = files.manifest.ui;

				// Try to find existing CSS import in the UI file
				cssFilePath = await findCssImportPath(uiFilePath, cwd);
			}
		} catch (error) {
			console.warn('Could not read manifest, using default src directory for components');
		}

		// Determine where the CSS file is located
		let cssPath: string;
		if (cssFilePath) {
			// Use the existing CSS file location
			cssPath = cssFilePath;
		} else {
			// Fallback to UI directory + styles.css
			cssPath = join(cwd, uiDir, 'styles.css');
		}

		// Convert absolute path to relative path for components.json
		const relativeCssPath = cssPath.startsWith(cwd) ? cssPath.substring(cwd.length + 1) : cssPath;

		// Store configuration in answers for postSetup to use
		answers.ext = ext;
		answers.uiDir = uiDir;
		answers.cssPath = cssPath;
		answers.relativeCssPath = relativeCssPath;
		answers.uiFilePath = uiFilePath;
		answers.cssFilePath = cssFilePath;
		answers.manifestUiPath = manifestUiPath;
	},

	async postSetup({ answers, helpers, typescript }) {
		const ext = answers.ext;

		// Create components.json file using template
		await helpers.writeTemplateFile('templates/integrations/shadcn', 'components.json', {
			style: answers.style,
			baseColor: answers.baseColor,
			relativeCssPath: answers.relativeCssPath,
		});

		// Update TypeScript config files
		if (typescript) {
			// Update both tsconfig.json and tsconfig.ui.json if they exist
			const tsConfigFiles = ['tsconfig.json', 'tsconfig.ui.json'];
			let updatedAny = false;

			for (const configFile of tsConfigFiles) {
				try {
					// Check if file exists
					const content = await helpers.readFile(configFile);
					if (content !== null) {
						// Update existing config
						await helpers.updateJson(configFile, (json) => {
							json.compilerOptions = json.compilerOptions || {};
							json.compilerOptions.baseUrl = '.';
							json.compilerOptions.paths = {
								'@/*': [`./${answers.uiDir}/*`],
							};
						});
						updatedAny = true;
						console.log(`Updated path aliases in ${configFile}`);
					}
				} catch (error) {
					// File doesn't exist, continue to next
					continue;
				}
			}

			if (!updatedAny) {
				console.warn('No TypeScript config files found. Path aliases will not be configured.');
			}
		}
	},

	nextSteps: (answers) => dedent`
		UI directory: ${chalk.magenta(answers.uiDir)}
		Add components using the Shadcn UI CLI:
		${chalk.cyan('npx shadcn@latest add button')}
		Visit ${chalk.magenta('https://ui.shadcn.com/docs/components')} for available components
		Import components from ${chalk.magenta('"@/components/ui"')}
	`,
});
