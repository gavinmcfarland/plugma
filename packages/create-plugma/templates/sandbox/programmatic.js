import { Combino } from 'combino';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateProjects() {
	// Create a new Combino instance
	const combino = new Combino();

	// Unified configuration that matches .combino file structure
	const config = {
		// Template composition - specify additional templates to include
		include: [
			{ source: '../base' },
			{ source: '../typescript/components', target: 'src/components' }
		],
		// Data to pass to templates for conditional logic and templating
		data: {
			project: {
				name: "My Awesome Project",
				description: "A sample project generated with Combino",
				version: "1.0.0",
				author: "John Doe",
				license: "MIT"
			}
		},
		// Merge strategy configuration for different file patterns
		merge: {
			"*": {
				strategy: "deep"
			},
			"*.json": {
				strategy: "deep"
			},
			"*.md": {
				strategy: "replace"
			}
		}
	};

	// Generate TypeScript project
	await combino.combine({
		include: [
			path.join(__dirname, 'templates/base'),
			path.join(__dirname, 'templates/typescript')
		],
		outputDir: path.join(__dirname, 'output/ts-project'),
		config,
		data: { language: 'ts' }
	});

	// Generate JavaScript project
	await combino.combine({
		include: [
			path.join(__dirname, 'templates/base'),
			path.join(__dirname, 'templates/typescript')
		],
		outputDir: path.join(__dirname, 'output/js-project'),
		config,
		data: { language: 'js' }
	});

	console.log('Projects generated successfully!');
}

// Run the generation
generateProjects().catch(console.error);
