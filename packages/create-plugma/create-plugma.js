#!/usr/bin/env node

import inquirer from 'inquirer';
import * as fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import createDirectoryContents from './scripts/create-directory-contents.js';
import path from 'path';
import { parse } from 'kdljs';
import _ from 'lodash';

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load framework configurations
const loadFrameworkConfig = (framework) => {
	const configPath = path.join(__dirname, 'config', 'frameworks', `${framework}.kdl`);
	const configContent = fs.readFileSync(configPath, 'utf-8');
	// console.log('KDL content:', configContent);
	const parsed = parse(configContent);
	// console.log('Parsed KDL:', JSON.stringify(parsed, null, 2));
	return parsed;
};

// Merge framework config with template data
const mergeFrameworkConfig = (frameworkConfig, templateData) => {
	// Create a deep copy of the template data
	const mergedData = JSON.parse(JSON.stringify(templateData));

	// If we have framework config, merge it into the template data
	if (frameworkConfig && frameworkConfig.output && frameworkConfig.output.length > 0) {
		const frameworkData = frameworkConfig.output[0];

		// Merge framework data into the template data
		if (frameworkData.children) {
			frameworkData.children.forEach(node => {
				// For each node in the framework config, merge it into the template data
				// if there's a matching property in the template
				if (node.name === 'vite') {
					mergedData.framework = mergedData.framework || {};
					mergedData.framework.vite = node;
				} else if (node.name === 'package') {
					mergedData.framework = mergedData.framework || {};
					mergedData.framework.package = node;
				} else if (node.name === 'tsconfig') {
					mergedData.framework = mergedData.framework || {};
					mergedData.framework.tsconfig = node;
				}
			});
		}
	}

	return mergedData;
};

// Process template files with framework config
export const processTemplate = (contents, templateData) => {
	// Configure lodash template settings
	_.templateSettings.interpolate = /<%-([\s\S]+?)%>/g;  // Unescaped output
	_.templateSettings.escape = /<%=([\s\S]+?)%>/g;      // Escaped output
	_.templateSettings.evaluate = /<%([\s\S]+?)%>/g;

	// Create template
	const template = _.template(contents);

	// Process template with merged data
	let processed = template(templateData);

	// If this is a JSON file, parse and merge framework config
	if (contents.trim().startsWith('{')) {
		try {
			const json = JSON.parse(processed);

			// Merge framework config if it exists
			if (templateData.framework) {
				if (templateData.framework.package && json.devDependencies) {
					json.devDependencies = {
						...json.devDependencies,
						...templateData.framework.package.devDependencies
					};
				}
				if (templateData.framework.tsconfig) {
					// Handle tsconfig references
					if (templateData.framework.tsconfig.references && json.references) {
						json.references = json.references.map(ref => {
							if (ref.path === './tsconfig.ui.json' &&
								templateData.framework.tsconfig.references.reference &&
								templateData.framework.tsconfig.references.reference.extends) {
								return {
									...ref,
									extends: templateData.framework.tsconfig.references.reference.extends
								};
							}
							return ref;
						});
					}
					// Handle compiler options
					if (json.compilerOptions) {
						json.compilerOptions = {
							...json.compilerOptions,
							...templateData.framework.tsconfig.compilerOptions
						};
					}
				}
			}

			// Convert back to string with proper formatting
			processed = JSON.stringify(json, null, '\t');
		} catch (e) {
			console.warn('Failed to parse JSON template:', e);
		}
	}

	return processed;
};

const questions = [
	{
		type: 'list',
		name: 'type',
		message: 'What type of project do you want to create?',
		choices: ['plugin', 'widget']
	},
	{
		type: 'list',
		name: 'language',
		message: 'Select a language:',
		choices: ['JavaScript', 'TypeScript']
	},
	{
		type: 'list',
		name: 'framework',
		message: 'Select a framework:',
		choices: ['Svelte', 'Vue', 'React', 'Vanilla']
	},
	{
		type: 'list',
		name: 'example',
		message: 'Select an example template:',
		choices: ['basic', 'minimal']
	},
	{
		type: 'input',
		name: 'name',
		message: 'Project name:',
		validate: input => {
			const valid = /^[a-zA-Z0-9_-]+$/.test(input);
			if (!valid) {
				return 'Project name can only include letters, numbers, underscores, and hyphens.';
			}
			const destDir = path.join(process.cwd(), input);
			if (fs.existsSync(destDir)) {
				return `Directory "${input}" already exists. Please choose a different name.`;
			}
			return true;
		}
	}
];

inquirer.prompt(questions).then(async answers => {
	const { name, type, language, framework, example } = answers;

	// Convert framework name to lowercase for file operations
	const frameworkLower = framework.toLowerCase();

	// Load framework configuration
	const frameworkConfig = loadFrameworkConfig(frameworkLower);

	// Define the source directories
	const baseTemplateDir = path.join(__dirname, 'templates', 'base');
	const frameworkTemplateDir = path.join(__dirname, 'templates', 'base', frameworkLower);
	const exampleTemplateDir = path.join(__dirname, 'templates', 'examples', frameworkLower, example);
	const destDir = path.join(CURR_DIR, name);

	// Create project directory
	fs.mkdirSync(destDir);

	// Create context object for template processing
	const context = {
		name,
		type,
		language: language.toLowerCase(),
		framework: frameworkLower,
		example,
		config: frameworkConfig
	};

	// Copy base template first (common files)
	await createDirectoryContents(baseTemplateDir, name, context);

	// Then copy framework-specific files
	if (fs.existsSync(frameworkTemplateDir)) {
		await createDirectoryContents(frameworkTemplateDir, name, context);
	}

	// Finally copy example template if it exists
	if (fs.existsSync(exampleTemplateDir)) {
		await createDirectoryContents(exampleTemplateDir, name, context);
	}

	console.log(`Next:
    cd ${name}
    npm install
    npm run dev`);
});










