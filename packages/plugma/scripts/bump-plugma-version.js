import { readFile, writeFile } from 'node:fs/promises';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define path to versions.json file
const plugmaVersionsPath = resolve(__dirname, '../versions.json');

/**
 * Get the appropriate dist tag based on current git branch
 */
async function getDistTag() {
	// First check CLI arg
	if (process.argv[2]) return process.argv[2];

	// Then check environment variable
	if (process.env.DIST_TAG) return process.env.DIST_TAG;

	try {
		// Check current git branch as fallback
		const { stdout } = await execAsync('git branch --show-current');
		const currentBranch = stdout.trim();

		// Use 'next' tag for development branches, 'latest' for main/master
		if (currentBranch === 'next' || currentBranch === 'develop' || currentBranch === 'dev') {
			return 'next';
		}

		return 'latest';
	} catch (error) {
		console.warn('Could not determine git branch, falling back to latest');
		return 'latest';
	}
}

async function getLatestVersion(packageName, tag) {
	// First check if we have the version in environment variables
	console.log("process.env.npm_package_version", process.env.npm_package_version);
	if (process.env.npm_package_version) {
		return process.env.npm_package_version;
	}

	try {
		const { stdout } = await execAsync(`npm show ${packageName}@${tag} version`);
		return stdout.trim();
	} catch (err) {
		if (tag !== 'latest') {
			console.warn(`No version found for ${packageName}@${tag}, falling back to latest.`);
			return getLatestVersion(packageName, 'latest');
		}
		throw new Error(`Failed to fetch version for ${packageName}@${tag}: ${err}`);
	}
}

/**
 * Update a single versions.json file
 */
async function updateSingleVersionFile(filePath, latestPlugmaVersion) {
	try {
		const versions = JSON.parse(await readFile(filePath, 'utf8'));

		if (versions.plugma !== latestPlugmaVersion) {
			versions.plugma = latestPlugmaVersion;
			await writeFile(filePath, JSON.stringify(versions, null, 2) + '\n');
			return true;
		}
		return false;
	} catch (error) {
		console.error(`❌ Error updating ${filePath}:`, error);
		return false;
	}
}

/**
 * Update versions.json file (plugma only)
 */
async function updateVersionFiles(distTag) {
	try {
		const latestPlugmaVersion = await getLatestVersion('plugma', distTag);

		// Update file
		const plugmaUpdated = await updateSingleVersionFile(plugmaVersionsPath, latestPlugmaVersion);

		if (plugmaUpdated) {
			console.log(`✅ Updated plugma version to ${latestPlugmaVersion} (tag: ${distTag})`);
			console.log(`   - Updated: packages/plugma/versions.json`);
		} else {
			console.log(`ℹ️ versions.json file is already up-to-date with version ${latestPlugmaVersion} (tag: ${distTag})`);
		}
	} catch (error) {
		console.error('❌ Error updating version file:', error);
	}
}

async function main() {
	const distTag = await getDistTag();
	await updateVersionFiles(distTag);
}

main().catch(console.error);
