import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define paths to both versions.json files
const plugmaVersionsPath = resolve(__dirname, '../versions.json');
const createPlugmaVersionsPath = resolve(__dirname, '../../create-plugma/versions.json');


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
		plugma: `^${actualVersion}`
	};

	try {
		// Update both files
		await Promise.all([
			writeFile(plugmaVersionsPath, JSON.stringify(publishVersions, null, 2) + '\n'),
			writeFile(createPlugmaVersionsPath, JSON.stringify(publishVersions, null, 2) + '\n')
		]);

		console.log('✅ Updated versions.json files for publishing:');
		console.log('   - packages/plugma/versions.json');
		console.log('   - packages/create-plugma/versions.json');
		console.log(`   - plugma dependency set to: ^${actualVersion}`);
	} catch (error) {
		console.error('❌ Error updating versions.json files for publishing:', error);
		process.exit(1);
	}
}

/**
 * Main function
 */
async function main() {
	const mode = process.argv[2];

	if (mode === 'publish' || mode === 'prod' || mode === 'production') {
		await setPublishMode();
	} else {
		console.error('❌ Invalid mode. Usage:');
		console.error('  node manage-versions.js publish|prod|production  # Set to publish mode');
		process.exit(1);
	}
}

main().catch(console.error);
