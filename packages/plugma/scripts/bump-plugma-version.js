import { readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const versionsFilePath = resolve(__dirname, '..', 'versions.json');

// Get the version from the env Lerna sets in postpublish
const plugmaVersion = process.env.npm_package_version;

async function updateVersionFile() {
	try {
		const versions = JSON.parse(await readFile(versionsFilePath, 'utf8'));

		if (versions.plugma !== plugmaVersion) {
			versions.plugma = plugmaVersion;
			await writeFile(versionsFilePath, JSON.stringify(versions, null, 2));
			console.log(`✅ Updated plugma version to ${plugmaVersion}`);
		} else {
			console.log(`ℹ️ Plugma is already up-to-date with version ${plugmaVersion}`);
		}
	} catch (error) {
		console.error('❌ Error updating version file:', error);
	}
}

updateVersionFile().catch(console.error);
