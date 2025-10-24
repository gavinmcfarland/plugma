import { defineIntegration } from './define-integration.js';
import MagicString from 'magic-string';
import dedent from 'dedent';
import chalk from 'chalk';
import { getUserFiles } from '../shared/index.js';
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
const devDependencies = {
	'shadcn-ui': 'latest',
};

export default defineIntegration({
	id: 'shadcn',
	name: 'Shadcn',
	description: 'UI components',
	requiresUI: true,

	// Add required integrations - this will ensure tailwind is set up first
	requires: ['tailwind'],

	questions: [
		{
			id: 'style',
			type: 'select',
			question: 'Choose a style:',
			shortLabel: 'Style',
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
			shortLabel: 'Color',
			options: [
				{ value: 'slate', label: 'Slate' },
				{ value: 'zinc', label: 'Zinc' },
				{ value: 'neutral', label: 'Neutral' },
				{ value: 'gray', label: 'Gray' },
			],
			default: 'slate',
		},
	],

	devDependencies,

	setup: [
		{
			label: 'Adding dependencies to package.json',
			action: async ({ helpers }) => {
				await helpers.updateJson('package.json', (json) => {
					json.devDependencies = json.devDependencies || {};
					Object.entries(devDependencies).forEach(([name, version]) => {
						json.devDependencies[name] = version;
					});
				});
			},
		},
		{
			label: 'Creating components.json',
			action: async ({ answers, helpers, typescript }) => {
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

				// Store configuration in answers for other tasks to use
				answers.ext = ext;
				answers.uiDir = uiDir;
				answers.cssPath = cssPath;
				answers.relativeCssPath = relativeCssPath;
				answers.uiFilePath = uiFilePath;
				answers.cssFilePath = cssFilePath;
				answers.manifestUiPath = manifestUiPath;

				// Create components.json
				await helpers.writeTemplateFile('templates/integrations/shadcn', 'components.json', {
					style: answers.style,
					baseColor: answers.baseColor,
					relativeCssPath: relativeCssPath,
				});
			},
		},
		{
			label: 'Configuring TypeScript path aliases',
			action: async ({ answers, helpers, typescript }) => {
				if (!typescript) {
					return;
				}

				const uiDir = answers.uiDir || 'src';
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
									'@/*': [`./${uiDir}/*`],
								};
							});
							updatedAny = true;
						}
					} catch (error) {
						// File doesn't exist, continue to next
						continue;
					}
				}

				if (!updatedAny) {
					console.warn('No TypeScript config files found. Path aliases will not be configured.');
				}
			},
		},
	],

	nextSteps: (answers) => `
		**Plugged in and ready to go!**

		1. UI directory: \`${answers.uiDir}\`
		2. Add components using \`npx shadcn@latest add button\`
		3. Visit https://ui.shadcn.com/docs/components for available components
		4. Import components from \`@/components/ui\`
	`,
});
