import { readFile, writeFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const versionsFilePath = resolve(__dirname, '../../create-plugma', 'versions.json');

// Read from CLI arg or fallback to 'latest'
const DIST_TAG = process.argv[2] || process.env.DIST_TAG || 'latest';

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

async function updateVersionFile() {
	try {
		const versions = JSON.parse(await readFile(versionsFilePath, 'utf8'));
		const latestPlugmaVersion = await getLatestVersion('plugma', DIST_TAG);

		if (versions.plugma !== latestPlugmaVersion) {
			versions.plugma = latestPlugmaVersion;
			await writeFile(versionsFilePath, JSON.stringify(versions, null, 2));
			console.log(`✅ Updated plugma version to ${latestPlugmaVersion} (tag: ${DIST_TAG})`);
		} else {
			console.log(`ℹ️ Plugma is already up-to-date with version ${latestPlugmaVersion} (tag: ${DIST_TAG})`);
		}
	} catch (error) {
		console.error('❌ Error updating version file:', error);
	}
}

updateVersionFile().catch(console.error);
