#!/usr/bin/env node

import { Combino } from 'combino';
import pkg from 'enquirer';
const { Select, Confirm, Input } = pkg;
import * as fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

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

async function main() {
	const frameworkPrompt = new Select({
		name: 'framework',
		message: 'Choose your framework:',
		choices: ['React', 'Svelte', 'Vue', 'Vanilla']
	});
	const typePrompt = new Select({
		name: 'type',
		message: 'Create plugin or widget?',
		choices: ['Plugin', 'Widget']
	});
	const examplePrompt = new Select({
		name: 'example',
		message: 'Select an example template:',
		choices: ['Basic', 'Minimal']
	});
	const languagePrompt = new Confirm({
		name: 'typescript',
		message: 'Include TypeScript?',
		initial: true
	});

	const framework = await frameworkPrompt.run();
	const type = await typePrompt.run();
	const example = await examplePrompt.run();
	const typescript = await languagePrompt.run();

	// Generate base name
	const baseName = `${example.toLowerCase()}-${framework.toLowerCase()}-${type.toLowerCase()}`;

	// Add debug suffix if debug flag is enabled
	const nameSuffix = debugFlag ? (typescript ? '-ts' : '-js') : '';
	const initialName = baseName + nameSuffix;

	const namePrompt = new Input({
		name: 'name',
		message: 'Project name:',
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

	// Add framework-specific template
	const frameworkTemplateDir = path.join(__dirname, 'templates', 'frameworks', frameworkLower);
	if (fs.existsSync(frameworkTemplateDir)) {
		templates.push(frameworkTemplateDir);
	}

	// Add example template (highest priority)
	const exampleTemplateDir = path.join(__dirname, 'templates', 'examples', type.toLowerCase(), example.toLowerCase());
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
		example: example.toLowerCase(),
		typescript,
		description: `A Figma ${type.toLowerCase()} with ${framework} and ${typescript ? 'TypeScript' : 'JavaScript'}`
	};

	// Initialize Combino
	const combino = new Combino();

	try {
		// Generate the project using Combino
		await combino.combine({
			outputDir: destDir,
			include: templates,
			templateEngine: 'ejs',
			data: templateData
		});

		console.log(`\n✅ Successfully created ${framework} ${type} project: ${name}`);
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










