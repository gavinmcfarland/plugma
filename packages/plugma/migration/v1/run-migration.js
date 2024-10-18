#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import prettier from 'prettier';

// Ask the user whether they want to proceed with the automatic migration and backup
async function askForMigration() {
	const answers = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'backupAndUpdate',
			message: `Backup and update vite.config.js now?`,
			default: true,
		},
	]);
	return answers;
}

// Read and backup the current vite.config.js
function backupConfig(filePath) {
	const backupPath = `${filePath}.backup-${Date.now()}`;
	fs.copyFileSync(filePath, backupPath);
	console.log(
		chalk.white(`\nBackup created at: `) +
		chalk.underline(`${backupPath}`)
	);
}

// Prettify and transform the vite.config.js file
async function prettifyAndTransform(viteConfig) {
	// Resolve Prettier configuration if any exists
	try {
		const prettierConfig = (await prettier.resolveConfig('./vite.config.js')) || {
			// Define fallback to default settings
			semi: true,
			singleQuote: false,
			trailingComma: 'es5',
			tabWidth: 2,
			useTabs: true,
			printWidth: 80, // Adjust to match your VS Code settings
		};

		// Format the result with Prettier using the resolved config
		const transformedConfig = prettier.format(viteConfig, {
			...prettierConfig,
			parser: 'babel',
		});
		return transformedConfig;
	} catch (error) {
		console.error('Error formatting with Prettier:', error);
		return viteConfig; // Return original config in case of error
	}
}

// Perform the migration
async function migrateConfig(filePath) {
	let viteConfig = fs.readFileSync(filePath, 'utf8');

	// Step 1: Remove the baseConfig import line
	viteConfig = viteConfig.replace(/import\s+baseConfig\s+from\s+['"]plugma\/lib\/vite\.config\.js['"];?\n?/, '');

	// Step 2: Replace the mergeConfig structure
	viteConfig = viteConfig.replace(/mergeConfig\(.*baseConfig,\s*{(.*)}\)\s*\)/s, (_, config) => {
		return `() => { return { ${config.trim()} } })`;
	});

	// Step 3: Check if mergeConfig is used elsewhere in the file
	const usesMergeConfig = viteConfig.includes('mergeConfig(');

	// Step 4: If mergeConfig is no longer used, remove it from the import statement
	if (!usesMergeConfig) {
		viteConfig = viteConfig.replace(
			/import\s*{\s*([^}]*)mergeConfig([^}]*)}\s*from\s*['"]vite['"]\s*;?\n?/,
			(_, beforeMerge, afterMerge) => {
				// If mergeConfig is the only import, replace the entire line
				if (!beforeMerge.trim() && !afterMerge.trim()) {
					return "import { defineConfig } from 'vite';\n";
				}

				// Clean up extra commas and spaces around the imports
				beforeMerge = beforeMerge.replace(/,\s*$/, '');  // Remove trailing comma if beforeMerge has a trailing comma
				afterMerge = afterMerge.replace(/^\s*,/, '');    // Remove leading comma if afterMerge has a leading comma

				// Return the updated import statement with mergeConfig removed
				return `import {${beforeMerge}${beforeMerge && afterMerge ? ', ' : ''}${afterMerge}} from 'vite';\n`;
			}
		);
	}

	// Step 5: Apply Prettier for formatting after all transformations
	viteConfig = await prettifyAndTransform(viteConfig);

	// Write the updated config back to the file
	fs.writeFileSync(filePath, viteConfig, 'utf8');

}

// Start the migration process
async function runMigration() {
	const viteConfigPath = path.resolve(process.cwd(), 'vite.config.js');

	if (!fs.existsSync(viteConfigPath)) {
		console.error(`vite.config.js not found in the current directory.`);
		process.exit(1);
	}

	const { backupAndUpdate } = await askForMigration();

	if (backupAndUpdate) {
		backupConfig(viteConfigPath);  // Create the backup before migrating
		await migrateConfig(viteConfigPath); // Ensure the migration is awaited
		console.log(chalk.white(`Migration complete.`));
	} else {
		console.log(chalk.white(`\nMigration canceled.`));
	}
}

// Execute the script
runMigration();
