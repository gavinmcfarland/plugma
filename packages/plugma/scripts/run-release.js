import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import process from 'process';
import path from 'path';

import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Utility function to copy directory contents recursively
async function copyDirectory(src, dest) {
	await fs.mkdir(dest, { recursive: true });
	const entries = await fs.readdir(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		entry.isDirectory()
			? await copyDirectory(srcPath, destPath)
			: await fs.copyFile(srcPath, destPath);
	}
}

export async function runRelease(options) {
	// Ensure the template is copied from `templates/github/` to `.github/` if not present
	const templateDir = path.join(__dirname, '../templates', 'github', 'workflows'); // Path to template in npm package
	const githubDir = path.join(process.cwd(), '.github', 'workflows'); // Path to user's .github/ folder

	try {
		const templateExists = await fs.stat(templateDir);
		if (!templateExists) {
			throw new Error(`Template directory ${templateDir} not found.`);
		}

		const githubExists = await fs.stat(githubDir).catch(() => null); // Check if .github/ exists
		if (!githubExists) {
			console.log(`.github/ directory not found. Copying templates to ${githubDir}...`);
			await copyDirectory(templateDir, githubDir);
			console.log('Templates copied successfully.');
		}
	} catch (err) {
		console.error(`Error copying GitHub templates: ${err.message}`);
		process.exit(1);
	}

	// Check if the current directory is a Git repository
	try {
		execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
	} catch (err) {
		console.error('Error: This is not a Git repository. Please initialize a Git repository before proceeding.');
		process.exit(1);
	}

	// Check if a manual version is provided, otherwise fallback to releaseType
	const manualVersion = options.version;
	const releaseType = options.type || 'stable';

	// Locate the package.json file
	const packageJsonPath = path.resolve(process.cwd(), 'package.json');
	let version;
	let newTag;  // Ensure newTag is declared here at the top-level scope

	try {
		const packageJsonData = await fs.readFile(packageJsonPath, 'utf8');
		const packageJson = JSON.parse(packageJsonData);

		// Initialize plugma.pluginVersion if not present
		if (!packageJson.plugma) {
			packageJson.plugma = {};
		}
		if (!packageJson.plugma.pluginVersion) {
			packageJson.plugma.pluginVersion = '0'; // Default initial version
			console.log('No plugma.pluginVersion found. Initializing it to 0.');
		}

		version = packageJson.plugma.pluginVersion;

		// Determine the new version tag
		if (manualVersion) {
			newTag = `v${manualVersion}`;
		} else if (releaseType === 'stable') {
			const newVersion = parseInt(version) + 1;
			newTag = `v${newVersion}`;
		} else {
			const existingTags = execSync(`git tag -l "v${version}-${releaseType}.*"`, { encoding: 'utf8' })
				.split('\n')
				.filter(Boolean)
				.sort();

			let subVersion = 0;
			if (existingTags.length > 0) {
				const lastTag = existingTags[existingTags.length - 1];
				const match = lastTag.match(/-(alpha|beta)\.(\d+)$/);
				if (match && match[2]) {
					subVersion = parseInt(match[2]) + 1;
				}
			}

			newTag = `v${version}-${releaseType}.${subVersion}`;
		}

		// Update version in package.json before committing
		if (manualVersion) {
			packageJson.plugma.pluginVersion = manualVersion;
		} else if (releaseType === 'stable') {
			packageJson.plugma.pluginVersion = `${parseInt(version) + 1}`;
		} else {
			const subVersion = newTag.match(/-(alpha|beta)\.(\d+)$/)[2];
			packageJson.plugma.pluginVersion = `${version}-${releaseType}.${subVersion}`;
		}

		await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
		console.log(`Version successfully updated to ${newTag} in package.json`);

	} catch (err) {
		console.error(`Error reading or updating package.json:`, err);
		process.exit(1);
	}

	// Stage changes for commit
	try {
		execSync('git add package.json .github', { stdio: 'inherit' });

		// Check if there are changes to commit
		const changes = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
		if (changes) {
			// Commit and tag
			execSync(`git commit -m "Release ${newTag}"`, { stdio: 'inherit' });
			execSync(`git tag ${newTag}`, { stdio: 'inherit' });
			execSync('git push', { stdio: 'inherit' });
			execSync(`git push origin ${newTag}`, { stdio: 'inherit' });
			console.log(`Successfully committed, tagged, and pushed: ${newTag}`);
		} else {
			console.log('No changes to commit.');
		}
	} catch (err) {
		console.error('Error committing or pushing to Git:', err);
		process.exit(1);
	}
}
