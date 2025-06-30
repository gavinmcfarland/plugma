#!/usr/bin/env node

import { Combino } from 'combino';
import pkg from 'enquirer';
const { Select, Confirm, Input, Toggle } = pkg;
import * as fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import { stripTSFromString } from 'strip-ts';
import chalk from 'chalk';
import ini from 'ini';

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const args = process.argv.slice(2);
const debugFlag = args.includes('-d') || args.includes('--debug');

// Helper function to clear directory if it exists
const clearDirectory = (dirPath) => {
	if (fs.existsSync(dirPath)) {
		fs.rmSync(dirPath, { recursive: true, force: true });
		console.log(`Cleared existing directory: ${dirPath}`);
	}
};

// Helper function to validate project name
const validateProjectName = (input) => {
	const valid = /^[a-zA-Z0-9_-]+$/.test(input);
	if (!valid) {
		return 'Project name can only include letters, numbers, underscores, and hyphens.';
	}
	const destDir = path.join(process.cwd(), input);
	if (fs.existsSync(destDir)) {
		return `Directory "${input}" already exists. Please choose a different name.`;
	}
	return true;
};

// Helper function to parse .combino metadata using INI parser
const parseCombinoMetadata = (filePath) => {
	try {
		const content = fs.readFileSync(filePath, 'utf8');

		// Parse the entire file as INI
		const parsed = ini.parse(content);

		// Extract the meta section
		const metadata = parsed.meta || {};

		// Convert string values to appropriate types
		const processedMetadata = {};

		Object.entries(metadata).forEach(([key, value]) => {
			// Handle boolean values
			if (value === 'true') {
				processedMetadata[key] = true;
			} else if (value === 'false') {
				processedMetadata[key] = false;
			}
			// Handle array values (INI parser might return them as strings)
			else if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
				processedMetadata[key] = value.slice(1, -1).split(',').map(item => item.trim());
			}
			// Handle quoted strings
			else if (typeof value === 'string' && ((value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'")))) {
				processedMetadata[key] = value.slice(1, -1);
			}
			// Keep other values as-is
			else {
				processedMetadata[key] = value;
			}
		});

		return processedMetadata;
	} catch (error) {
		console.log(chalk.yellow(`Warning: Could not parse metadata from ${filePath}: ${error.message}`));
		return null;
	}
};

// Helper function to get available examples based on metadata
const getAvailableExamples = () => {
	const examplesDir = path.join(__dirname, 'templates', 'examples');
	const examples = [];

	if (!fs.existsSync(examplesDir)) {
		return examples;
	}

	const exampleDirs = fs.readdirSync(examplesDir, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);

	exampleDirs.forEach(exampleName => {
		const combinoPath = path.join(examplesDir, exampleName, '.combino');
		if (fs.existsSync(combinoPath)) {
			// Read the raw .combino file directly from filesystem
			// This avoids any template processing that might affect the metadata
			const metadata = parseCombinoMetadata(combinoPath);
			if (metadata) {
				examples.push({
					name: exampleName,
					metadata
				});
			}
		}
	});

	return examples;
};

// Helper function to filter examples based on user choices
const filterExamples = (examples, needsUI, framework) => {
	return examples.filter(example => {
		const { metadata } = example;

		// Check if UI requirement matches
		// If metadata.ui is defined, it must match the user's choice
		if (metadata.ui !== undefined && metadata.ui !== needsUI) {
			return false;
		}

		// Only check framework compatibility for examples with UI
		// Examples without UI (ui = false) don't need framework filtering
		if (metadata.ui === true && metadata.frameworks) {
			// Handle both array and string cases
			let frameworksArray = metadata.frameworks;
			if (typeof metadata.frameworks === 'string') {
				// If it's an empty string, treat as no frameworks supported
				if (metadata.frameworks.trim() === '') {
					return false;
				}
				// Try to parse as array if it looks like one
				if (metadata.frameworks.startsWith('[') && metadata.frameworks.endsWith(']')) {
					frameworksArray = metadata.frameworks.slice(1, -1).split(',').map(item => item.trim());
				} else {
					// Single framework as string
					frameworksArray = [metadata.frameworks.trim()];
				}
			}

			if (Array.isArray(frameworksArray)) {
				// If frameworks array is empty, it means no frameworks are supported
				if (frameworksArray.length === 0) {
					return false;
				}
				// Check if the selected framework is in the supported list
				if (!frameworksArray.includes(framework.toLowerCase())) {
					return false;
				}
			}
		}

		return true;
	});
};

// Helper function to get available types from examples
const getAvailableTypes = (examples, needsUI, framework) => {
	const types = new Set();
	examples.forEach(example => {
		const { metadata } = example;
		// Only add the type if the example supports the selected framework and UI requirement
		if (
			(metadata.ui === undefined || metadata.ui === needsUI) &&
			(!metadata.frameworks || metadata.frameworks.length === 0 || metadata.frameworks.includes(framework.toLowerCase()))
		) {
			if (metadata.type) {
				types.add(metadata.type);
			}
		}
	});
	return Array.from(types);
};

async function main() {
	const uiPrompt = new Toggle({
		name: 'needsUI',
		message: 'Do you need a UI?',
		enabled: 'Yes',
		disabled: 'No',
		initial: true
	});

	const needsUI = await uiPrompt.run();

	let framework = 'Vanilla'; // Default framework
	if (needsUI) {
		const frameworkPrompt = new Select({
			name: 'framework',
			message: 'Choose a framework:',
			choices: ['React', 'Svelte', 'Vue', 'Vanilla']
		});
		framework = await frameworkPrompt.run();
	}

	// Get available examples and filter them
	const allExamples = getAvailableExamples();
	const availableExamples = filterExamples(allExamples, needsUI, framework);

	if (availableExamples.length === 0) {
		console.log(chalk.red('No examples available for the selected configuration.'));
		process.exit(1);
	}

	// Get available types from filtered examples (with stricter filtering)
	const availableTypes = getAvailableTypes(availableExamples, needsUI, framework);

	if (availableTypes.length === 0) {
		console.log(chalk.red('No valid types found in available examples.'));
		process.exit(1);
	}

	const typePrompt = new Select({
		name: 'type',
		message: 'Create plugin or widget?',
		choices: availableTypes.map(type => type.charAt(0).toUpperCase() + type.slice(1))
	});

	const type = await typePrompt.run();

	// Filter examples by selected type
	const typeFilteredExamples = availableExamples.filter(example =>
		example.metadata.type === type.toLowerCase()
	);

	if (typeFilteredExamples.length === 0) {
		console.log(chalk.red(`No examples available for ${type} with the selected configuration.`));
		process.exit(1);
	}

	const examplePrompt = new Select({
		name: 'example',
		message: 'Select an example:',
		choices: typeFilteredExamples.map(example => {
			const description = example.metadata.description || '';
			const displayName = example.name.charAt(0).toUpperCase() + example.name.slice(1).replace(/-/g, ' ');
			const choiceText = displayName;
			return {
				name: choiceText,
				value: displayName,
				hint: description
			};
		})
	});

	const example = await examplePrompt.run();
	const selectedExample = typeFilteredExamples.find(ex =>
		ex.name.toLowerCase() === example.toLowerCase()
	);

	const languagePrompt = new Confirm({
		name: 'typescript',
		message: 'Include TypeScript?',
		initial: true
	});

	const typescript = await languagePrompt.run();

	// Generate base name
	const baseName = `${selectedExample.name.toLowerCase()}-${framework.toLowerCase()}-${type.toLowerCase()}`;

	// Add debug suffix if debug flag is enabled
	const nameSuffix = debugFlag ? (typescript ? '-ts' : '-js') : '';
	const initialName = baseName + nameSuffix;

	const namePrompt = new Input({
		name: 'name',
		message: `${type.charAt(0).toUpperCase() + type.slice(1)} name:`,
		initial: initialName,
		validate: validateProjectName
	});
	const name = await namePrompt.run();

	// Convert framework name to lowercase for file operations
	const frameworkLower = framework.toLowerCase();
	const languageLower = typescript ? 'typescript' : 'javascript';

	// Define the output directory
	const destDir = path.join(CURR_DIR, name);

	// Clear directory if it exists
	clearDirectory(destDir);

	// Prepare template paths based on user choices
	const templates = [];

	// Add base template first (lowest priority)
	templates.push(path.join(__dirname, 'templates', 'base'));

	// Add framework-specific template only if UI is needed
	if (needsUI) {
		const frameworkTemplateDir = path.join(__dirname, 'templates', 'frameworks', frameworkLower);
		if (fs.existsSync(frameworkTemplateDir)) {
			templates.push(frameworkTemplateDir);
		}
	}

	// Add example template (highest priority)
	const exampleTemplateDir = path.join(__dirname, 'templates', 'examples', selectedExample.name);
	if (fs.existsSync(exampleTemplateDir)) {
		templates.push(exampleTemplateDir);
	}

	// Add TypeScript template if selected
	if (typescript) {
		const typescriptTemplateDir = path.join(__dirname, 'templates', 'typescript');
		if (fs.existsSync(typescriptTemplateDir)) {
			templates.push(typescriptTemplateDir);
		}
	}

	// Create context object for template processing
	const templateData = {
		name,
		type: type.toLowerCase(),
		language: languageLower,
		framework: frameworkLower,
		example: selectedExample.name.toLowerCase(),
		typescript,
		needsUI,
		description: `A Figma ${type.toLowerCase()} with ${needsUI ? framework : 'no UI'} and ${typescript ? 'TypeScript' : 'JavaScript'}`
	};

	// Initialize Combino
	const combino = new Combino();

	try {
		// Generate the project using Combino
		await combino.combine({
			outputDir: destDir,
			include: templates,
			templateEngine: 'ejs',
			data: templateData,
			onFileProcessed: async (context) => {
				const { targetPath, content, data } = context;

				// Ensure content is always a string
				const safeContent = content || '';

				// Skip vite-env.d.ts files by returning unchanged
				if (path.basename(targetPath) === 'vite-env.d.ts') {
					return {
						content: safeContent,
						targetPath
					};
				}

				let newPath = targetPath;
				let processedContent = safeContent;

				// // Add a comment to all JavaScript files
				// if (targetPath.endsWith(".js")) {
				// 	processedContent = `// Generated by Combino\n${safeContent}`;
				// }

				// If TypeScript is disabled, strip TypeScript annotations from relevant files
				if (!data.typescript) {
					const ext = path.extname(targetPath).toLowerCase();

					// Check if this is a TypeScript file that should be converted
					if (ext === '.ts' || ext === '.tsx' || ext === '.vue' || ext === '.svelte') {
						try {
							// Map file extension to file type for strip-ts
							let fileType;
							if (ext === '.ts') fileType = 'ts';
							else if (ext === '.tsx') fileType = 'tsx';
							else if (ext === '.vue') fileType = 'vue';
							else if (ext === '.svelte') fileType = 'svelte';

							// Process content directly with strip-ts
							const strippedContent = await stripTSFromString(safeContent, fileType);

							if (strippedContent && strippedContent !== safeContent) {
								// Update the target path to use .js extension for .ts files
								if (ext === '.ts') {
									newPath = targetPath.replace('.ts', '.js');
								} else if (ext === '.tsx') {
									newPath = targetPath.replace('.tsx', '.jsx');
								}

								console.log(chalk.gray(`     🔄 Stripped TypeScript from ${path.basename(targetPath)}`));

								processedContent = strippedContent;
							}
						} catch (error) {
							console.log(chalk.yellow(`     ⚠️  Failed to strip TypeScript from ${path.basename(targetPath)}: ${error.message}`));
						}
					}
				}

				// Ensure final content is always a string
				const finalContent = typeof processedContent === 'string' ? processedContent : String(processedContent);

				return {
					content: finalContent,
					targetPath: newPath
				};
			},
		});

		console.log(`\nNext steps:\n    cd ${name}\n    npm install\n    npm run dev`);
	} catch (error) {
		console.error('Error generating project:', error);
		process.exit(1);
	}
}

main().catch((err) => {
	if (err === '' || (err && err.isTtyError)) {
		// User exited the prompt (e.g., Ctrl+C or Esc)
		process.exit(0);
	}
	console.error(err);
	process.exit(1);
});










