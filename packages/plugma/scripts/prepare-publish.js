import { readFile, writeFile } from 'node:fs/promises';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = resolve(__dirname, '../package.json');

/**
 * Get the appropriate dist tag based on current git branch or environment
 */
async function getDistTag() {
	// First check CLI arg
	if (process.argv[2]) return process.argv[2];

	// Then check environment variable (set by Lerna)
	if (process.env.LERNA_DIST_TAG) return process.env.LERNA_DIST_TAG;
	if (process.env.DIST_TAG) return process.env.DIST_TAG;

	try {
		// Check current git branch as fallback
		const { stdout } = await execAsync('git branch --show-current');
		const currentBranch = stdout.trim();

		// Use 'next' tag for development branches, 'latest' for main/master
		if (currentBranch === 'next' || currentBranch === 'next-new-cli' || currentBranch === 'develop' || currentBranch === 'dev') {
			return 'next';
		}

		return 'latest';
	} catch (error) {
		console.warn('Could not determine git branch, falling back to latest');
		return 'latest';
	}
}

/**
 * Update the create-plugma dependency based on the dist-tag
 */
async function updateCreatePlugmaDependency(distTag) {
	try {
		const packageJsonContent = await readFile(packageJsonPath, 'utf8');
		const packageJson = JSON.parse(packageJsonContent);

		if (!packageJson.dependencies || !packageJson.dependencies['create-plugma']) {
			console.warn('⚠️ create-plugma dependency not found in package.json');
			return;
		}

		const currentDep = packageJson.dependencies['create-plugma'];

		if (distTag === 'next') {
			// For next releases, use the dist-tag
			if (currentDep !== 'next') {
				packageJson.dependencies['create-plugma'] = 'next';
				await writeFile(packageJsonPath, JSON.stringify(packageJson, null, '\t') + '\n');
				console.log(`✅ Updated create-plugma dependency from "${currentDep}" to "next"`);
			} else {
				console.log(`ℹ️ create-plugma dependency is already set to "next"`);
			}
		} else {
			// For latest releases, ensure it's using workspace:* (Lerna will convert to exact version)
			if (currentDep !== 'workspace:*') {
				packageJson.dependencies['create-plugma'] = 'workspace:*';
				await writeFile(packageJsonPath, JSON.stringify(packageJson, null, '\t') + '\n');
				console.log(`✅ Updated create-plugma dependency from "${currentDep}" to "workspace:*"`);
			} else {
				console.log(`ℹ️ create-plugma dependency is already set to "workspace:*"`);
			}
		}
	} catch (error) {
		console.error('❌ Error updating create-plugma dependency:', error);
		throw error;
	}
}

async function main() {
	const distTag = await getDistTag();
	console.log(`📦 Preparing for publish with dist-tag: ${distTag}`);
	await updateCreatePlugmaDependency(distTag);
}

main().catch((error) => {
	console.error('Failed to prepare for publish:', error);
	process.exit(1);
});

