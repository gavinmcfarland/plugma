import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define path to versions.json file
const plugmaVersionsPath = resolve(__dirname, '../versions.json');

/**
 * Update versions.json files for development mode (use link: dependencies)
 */
async function setDevelopmentMode() {
	console.log('🔗 Setting versions.json files to development mode (link: dependencies)');

	const developmentVersions = {
		plugmaNext: "1.0.0-38",
		plugma: "link:../plugma"
	};

	try {
		// Update versions.json file
		await writeFile(plugmaVersionsPath, JSON.stringify(developmentVersions, null, 2) + '\n');

		console.log('✅ Updated versions.json file for development:');
		console.log('   - packages/plugma/versions.json');
		console.log('   - plugma dependency set to: link:../plugma');
	} catch (error) {
		console.error('❌ Error updating versions.json file for development:', error);
		process.exit(1);
	}
}

/**
 * Update versions.json files for publish mode (use actual versions)
 */
async function setPublishMode() {
	console.log('📦 Setting versions.json files to publish mode (actual versions)');

	// Read current package.json to get the actual version
	const packageJsonPath = resolve(__dirname, '../package.json');
	const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
	const actualVersion = packageJson.version;

	const publishVersions = {
		plugmaNext: "1.0.0-38",
		plugma: `^${actualVersion}`
	};

	try {
		// Update versions.json file
		await writeFile(plugmaVersionsPath, JSON.stringify(publishVersions, null, 2) + '\n');

		console.log('✅ Updated versions.json file for publishing:');
		console.log('   - packages/plugma/versions.json');
		console.log(`   - plugma dependency set to: ^${actualVersion}`);
	} catch (error) {
		console.error('❌ Error updating versions.json file for publishing:', error);
		process.exit(1);
	}
}

/**
 * Main function
 */
async function main() {
	const mode = process.argv[2];

	if (mode === 'dev' || mode === 'development') {
		await setDevelopmentMode();
	} else if (mode === 'publish' || mode === 'prod' || mode === 'production') {
		await setPublishMode();
	} else {
		console.error('❌ Invalid mode. Usage:');
		console.error('  node manage-versions.js dev|development  # Set to development mode');
		console.error('  node manage-versions.js publish|prod|production  # Set to publish mode');
		process.exit(1);
	}
}

main().catch(console.error);
