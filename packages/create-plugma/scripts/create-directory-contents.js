import slugify from 'slugify';
import * as fs from 'fs';
const CURR_DIR = process.cwd();
import _ from 'lodash'
import path from 'path';
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { processTemplate } from '../create-plugma.js';

const versionsPath = join(
	dirname(fileURLToPath(import.meta.url)),
	'../versions.json'
);
const versions = JSON.parse(fs.readFileSync(versionsPath, 'utf8'));

const __dirname = dirname(fileURLToPath(import.meta.url));

// Helper function to find UI file in a directory
const findUIFile = (dir) => {
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const fullPath = path.join(dir, file);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory()) {
			// Skip node_modules and other common directories
			if (['node_modules', '.git', 'dist'].includes(file)) continue;

			const result = findUIFile(fullPath);
			if (result) return result;
		} else if (file === 'ui.ts' || file === 'ui.js') {
			return fullPath;
		}
	}
	return null;
};

// Helper function to convert KDL nodes to a flat object
const kdlToObject = (nodes) => {
	console.log('Converting KDL nodes to object:', JSON.stringify(nodes, null, 2));
	const obj = {};

	// Group nodes by name to detect arrays
	const nodeGroups = nodes.reduce((groups, node) => {
		if (!groups[node.name]) {
			groups[node.name] = [];
		}
		groups[node.name].push(node);
		return groups;
	}, {});

	console.log('Grouped nodes:', JSON.stringify(nodeGroups, null, 2));

	// Process each group of nodes
	for (const [key, groupNodes] of Object.entries(nodeGroups)) {
		// If we have multiple nodes with the same name, create an array
		if (groupNodes.length > 1) {
			obj[key] = groupNodes.map(node => {
				const value = node.children.length > 0
					? kdlToObject(node.children)
					: node.values.length > 0
						? node.values[0]
						: {};

				return {
					...(typeof value === 'object' ? value : { value }),
					...node.properties
				};
			});
		} else {
			// Single node, process normally
			const node = groupNodes[0];
			let value;

			if (node.children.length > 0) {
				value = kdlToObject(node.children);
			} else if (node.values.length > 0) {
				value = node.values[0];
			} else {
				value = {};
			}

			if (node.properties && Object.keys(node.properties).length > 0) {
				obj[key] = { ...(typeof value === 'object' ? value : { value }), ...node.properties };
			} else {
				obj[key] = value;
			}
		}
	}

	console.log('Processed object:', JSON.stringify(obj, null, 2));

	// Flatten any nested arrays in the object
	const flattenNestedArrays = (obj) => {
		for (const [key, value] of Object.entries(obj)) {
			if (Array.isArray(value)) {
				obj[key] = value.flatMap(item => {
					if (typeof item === 'object' && item !== null) {
						// Recursively flatten nested objects
						flattenNestedArrays(item);
						// If the item has a single key that matches its parent key, return its value
						const itemKeys = Object.keys(item);
						if (itemKeys.length === 1 && itemKeys[0] === key) {
							return Array.isArray(item[key]) ? item[key] : [item[key]];
						}
					}
					return item;
				});
			} else if (typeof value === 'object' && value !== null) {
				flattenNestedArrays(value);
			}
		}
		return obj;
	};

	const flattened = flattenNestedArrays(obj);
	console.log('Final flattened object:', JSON.stringify(flattened, null, 2));
	return flattened;
};

// Helper function to process KDL config into template variables
const processKDLConfig = (config) => {
	let result = {};

	// Process framework config
	if (config.output && config.output.length > 0) {
		result = kdlToObject(config.output);
	}

	return result;
};

const createDirectoryContents = (templatePath, newProjectPath, context) => {
	if (!fs.existsSync(templatePath)) {
		console.warn(`Template path ${templatePath} does not exist, skipping...`);
		return;
	}

	// Find UI file and determine manifest paths
	let manifest = {
		main: 'index.js',
		ui: 'ui.js'
	};

	if (context.example) {
		const examplePath = path.join(__dirname, 'templates', 'examples', context.framework, context.example);
		if (fs.existsSync(examplePath)) {
			const uiFile = findUIFile(examplePath);
			if (uiFile) {
				// Get relative path from example root
				const relativePath = path.relative(examplePath, uiFile);
				// Remove framework-specific directories (e.g., 'svelte', 'react', etc.)
				const cleanPath = relativePath.split(path.sep).filter(part =>
					!['svelte', 'react', 'vue'].includes(part)
				).join(path.sep);

				manifest.ui = cleanPath;
				manifest.main = cleanPath;
			}
		}
	}

	const filesToCreate = fs.readdirSync(templatePath);

	filesToCreate.forEach(file => {
		const origFilePath = `${templatePath}/${file}`;
		const stats = fs.statSync(origFilePath);

		if (stats.isFile()) {
			let contents = fs.readFileSync(origFilePath, 'utf8');

			// Configure lodash template settings
			_.templateSettings.interpolate = /<%-([\s\S]+?)%>/g;  // Unescaped output
			_.templateSettings.escape = /<%=([\s\S]+?)%>/g;      // Escaped output
			_.templateSettings.evaluate = /<%([\s\S]+?)%>/g;

			// Create template data from context and KDL config
			const templateData = {
				...context,
				id: slugify(context.name),
				...processKDLConfig(context.config),
				plugin: {
					name: context.name,
					id: slugify(context.name),
					type: context.type,
					framework: context.framework,
					language: context.language
				},
				manifest,
				versions
			};

			console.log('Template data:', JSON.stringify(templateData, null, 2));

			// Process template files
			if (file.endsWith('.template') ||
				file === "manifest.json" ||
				file === "package.json" ||
				file.toUpperCase() === "README.MD") {
				contents = processTemplate(contents, templateData);
			}

			// Handle special files
			if (file === 'gitignore') file = '.gitignore';
			if (file.endsWith('.template')) {
				file = file.replace('.template', '');
			}

			const writePath = `${CURR_DIR}/${newProjectPath}/${file}`;
			fs.writeFileSync(writePath, contents, 'utf8');
		} else if (stats.isDirectory()) {
			// Skip framework-specific directories
			if (['svelte', 'react', 'vue'].includes(file)) {
				// Copy contents of framework directory directly to parent
				createDirectoryContents(origFilePath, newProjectPath, context);
			} else {
				fs.mkdirSync(`${CURR_DIR}/${newProjectPath}/${file}`, { recursive: true });
				createDirectoryContents(origFilePath, `${newProjectPath}/${file}`, context);
			}
		}
	});
};

export default createDirectoryContents;
