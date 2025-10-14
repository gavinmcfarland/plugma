import dedent from 'dedent';
import chalk from 'chalk';
import { defineIntegration } from './define-integration.js';
import MagicString from 'magic-string';
import { dirname, resolve, join, relative } from 'node:path';
import { getUserFiles } from '../utils/get-user-files.js';
import { readFile } from 'node:fs/promises';

/**
 * 1. Add import to styles.css file
 * 2. Add tailwindcss to vite.config.ts file
 * 3. Install tailwindcss and @tailwindcss/vite
 *
 * @see https://tailwindcss.com/docs/installation
 */

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

export default defineIntegration({
	id: 'tailwind',
	name: 'Tailwind',
	description: 'CSS framework',

	dependencies: ['tailwindcss', '@tailwindcss/vite'],

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
			// Fallback to 'src' if manifest cannot be read
			console.warn('Could not read manifest, using default src directory for styles');
		}

		// Determine where to create the CSS file
		let targetCssPath: string;
		if (cssFilePath) {
			// Use the existing CSS file location
			targetCssPath = cssFilePath;
		} else {
			// Fallback to UI directory + styles.css
			targetCssPath = join(cwd, uiDir, 'styles.css');
		}

		// Convert absolute path to relative path for helpers.updateFile
		const relativeCssPath = targetCssPath.startsWith(cwd) ? targetCssPath.substring(cwd.length + 1) : targetCssPath;

		// Store the paths in answers for nextSteps to use
		answers.uiDir = uiDir;
		answers.targetCssPath = targetCssPath;
		answers.relativeCssPath = relativeCssPath;
		answers.ext = ext;
		answers.uiFilePath = uiFilePath;
		answers.cssFilePath = cssFilePath;
		answers.manifestUiPath = manifestUiPath;
	},

	async postSetup({ answers, helpers, typescript }) {
		const ext = answers.ext;
		const uiDir = answers.uiDir;
		const relativeCssPath = answers.relativeCssPath;
		const uiFilePath = answers.uiFilePath;
		const cssFilePath = answers.cssFilePath;
		const manifestUiPath = answers.manifestUiPath;
		const targetCssPath = answers.targetCssPath;

		// Create base CSS file
		await helpers.updateFile(relativeCssPath, (content) => {
			if (!content) return dedent`@import "tailwindcss";`;
			if (!content.includes('@import "tailwindcss"')) {
				return dedent`@import "tailwindcss";\n
${content}`;
			}
			return content;
		});

		// Check for Vite config files in order of preference
		const viteConfigFile = await helpers.detectViteConfigFile();

		if (!viteConfigFile) {
			console.warn('No Vite config file found. Tailwind plugin will not be added to Vite config.');
			return;
		}

		// Update Vite config to use Tailwind
		await helpers.updateFile(viteConfigFile, (content) => {
			const s = new MagicString(content);

			// Add tailwind import if needed
			if (!content.includes('@tailwindcss/vite')) {
				// Find the last import
				const importRegex = /import\s+.*?from\s+['"].*?['"];?/g;
				const imports: RegExpExecArray[] = [];
				let match;
				while ((match = importRegex.exec(content)) !== null) {
					imports.push(match);
				}
				const lastImport = imports[imports.length - 1];

				if (lastImport) {
					s.appendLeft(
						lastImport.index! + lastImport[0].length,
						"\nimport tailwindcss from '@tailwindcss/vite'",
					);
				} else {
					s.prepend("import tailwindcss from '@tailwindcss/vite'\n");
				}
			}

			// Handle context-based plugin configuration
			// Look for plugins: context === 'ui' ? [react()] : [] pattern
			const contextBasedMatch = /plugins:\s*context\s*===\s*['"]ui['"]\s*\?\s*\[([\s\S]*?)\]\s*:\s*\[\]/.exec(
				content,
			);
			if (contextBasedMatch) {
				// Found context-based configuration
				const existingUiPlugins = contextBasedMatch[1];

				if (!existingUiPlugins.includes('tailwindcss')) {
					// Use string replacement to add tailwindcss to the UI plugins array
					const needsComma = existingUiPlugins.trim() !== '';
					const newUiPlugins = needsComma ? `${existingUiPlugins}, tailwindcss()` : 'tailwindcss()';

					// Replace the UI plugins array content using MagicString
					const matchStart = contextBasedMatch.index;
					const matchEnd = contextBasedMatch.index + contextBasedMatch[0].length;
					const replacement = `plugins: context === 'ui' ? [${newUiPlugins}] : []`;

					s.overwrite(matchStart, matchEnd, replacement);
				}
			} else {
				// Fallback to simple plugins array
				const pluginsMatch = /plugins:\s*\[([\s\S]*?)\]/.exec(content);
				if (pluginsMatch) {
					const pluginsStart = pluginsMatch.index! + pluginsMatch[0].indexOf('[') + 1;
					const pluginsEnd = pluginsMatch.index! + pluginsMatch[0].lastIndexOf(']');
					const existingPlugins = pluginsMatch[1];

					if (!existingPlugins.includes('tailwindcss')) {
						if (existingPlugins.trim() === '') {
							s.appendLeft(pluginsStart, 'tailwindcss()');
						} else {
							const needsComma = !existingPlugins.trim().endsWith(',');
							s.appendLeft(pluginsEnd, `${needsComma ? ', ' : ' '}tailwindcss()`);
						}
					}
				}
			}

			return s.toString();
		});

		// Add CSS import to UI file if no CSS import was found
		if (!cssFilePath && uiFilePath && manifestUiPath) {
			// Calculate relative path from UI file to CSS file
			const uiFileDir = dirname(uiFilePath);
			const cssFileDir = dirname(targetCssPath);
			const relativePath = relative(uiFileDir, cssFileDir);
			const cssFileName = relativeCssPath.split('/').pop() || 'styles.css';
			const importPath =
				relativePath === '.' || relativePath === '' ? `./${cssFileName}` : `./${relativePath}/${cssFileName}`;

			await helpers.updateFile(manifestUiPath, (content) => {
				const s = new MagicString(content);

				// Check if CSS import already exists
				if (!content.includes(cssFileName)) {
					// Find the last import to add CSS import after it
					const importRegex = /import\s+.*?from\s+['"].*?['"];?/g;
					const imports: RegExpExecArray[] = [];
					let match;
					while ((match = importRegex.exec(content)) !== null) {
						imports.push(match);
					}

					if (imports.length > 0) {
						// Add after the last import
						const lastImport = imports[imports.length - 1];
						s.appendLeft(lastImport.index! + lastImport[0].length, `\nimport '${importPath}';`);
					} else {
						// Add at the beginning if no imports exist
						s.prepend(`import '${importPath}';\n`);
					}
				}

				return s.toString();
			});
		}
	},

	nextSteps: (answers) => {
		const uiDir = answers.uiDir || 'src';
		const relativeCssPath = answers.relativeCssPath || `${uiDir}/styles.css`;

		return `**Plugged in and ready to go!**

		1. Tailwind CSS file at \`${relativeCssPath}\`
		2. Add Tailwind classes to your HTML
		3. Example: \`<div class="flex items-center justify-center">\`
		`;
	},
});
