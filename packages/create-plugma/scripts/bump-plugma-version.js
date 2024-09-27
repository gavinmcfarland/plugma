import { readFile, writeFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';

const execAsync = promisify(exec);

// Use process.cwd() to get the current working directory (the root of the project when you run the script)
const rootDirectory = process.cwd();

// Path to the versions.json file at the root
const versionsFilePath = resolve(rootDirectory, 'versions.json');

// Fetch the latest version of plugma from npm
async function getLatestVersion(packageName) {
	const { stdout } = await execAsync(`npm show ${packageName} version`);
	return stdout.trim();
}

// Update the versions.json file
async function updateVersionFile() {
	try {
		const versions = JSON.parse(await readFile(versionsFilePath, 'utf8'));

		const latestPlugmaVersion = await getLatestVersion('plugma');

		if (versions.plugma !== latestPlugmaVersion) {
			versions.plugma = latestPlugmaVersion;
			await writeFile(versionsFilePath, JSON.stringify(versions, null, 2));
			console.log(`Updated plugma version to ${latestPlugmaVersion}`);
		} else {
			console.log('Plugma is already up-to-date.');
		}
	} catch (error) {
		console.error('Error updating version file:', error);
	}
}

updateVersionFile().catch(console.error);
