import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import process from 'process';
import path from 'path';

export async function runRelease(options) {
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

	// Check if the user is logged into Git
	try {
		const gitUserName = execSync('git config user.name', { encoding: 'utf8' }).trim();
		const gitUserEmail = execSync('git config user.email', { encoding: 'utf8' }).trim();

		if (!gitUserName || !gitUserEmail) {
			console.error('Git user name or email is not configured. Please log into Git or configure your Git user information.');
			process.exit(1);
		}
		console.log(`Git user: ${gitUserName} <${gitUserEmail}>`);
	} catch (err) {
		console.error('Git is not configured or you are not logged in. Please configure Git and log in before proceeding.');
		process.exit(1);
	}

	// Locate the package.json file and extract or add the plugma.pluginVersion field
	const packageJsonPath = path.resolve(process.cwd(), 'package.json');
	let version;

	try {
		const packageJsonData = await fs.readFile(packageJsonPath, 'utf8');
		const packageJson = JSON.parse(packageJsonData);

		// If plugma or pluginVersion is missing, initialize it
		if (!packageJson.plugma) {
			packageJson.plugma = {};
		}
		if (!packageJson.plugma.pluginVersion) {
			packageJson.plugma.pluginVersion = '0'; // Default initial version
			console.log('No plugma.pluginVersion found. Initializing it to 0.');
		}

		version = packageJson.plugma.pluginVersion;

		// Write back the updated package.json if it was missing the pluginVersion field
		await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
	} catch (err) {
		console.error(`Error reading or writing package.json:`, err);
		process.exit(1);
	}

	// Determine the new tag based on manual version or release type
	let newTag;

	if (manualVersion) {
		// Use the manual version provided
		newTag = `v${manualVersion}`;
		try {
			// Update the plugma.pluginVersion field with the manually provided version
			const packageJsonData = await fs.readFile(packageJsonPath, 'utf8');
			const packageJson = JSON.parse(packageJsonData);
			packageJson.plugma.pluginVersion = `${manualVersion}`;

			await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
			console.log(`Manual release: Setting version to ${newTag} and updating package.json`);
		} catch (err) {
			console.error(`Error updating package.json:`, err);
			process.exit(1);
		}
	} else if (releaseType === 'stable') {
		// For stable releases, increment the major version and update the package.json file
		const newVersion = parseInt(version) + 1;
		newTag = `v${newVersion}`;
		try {
			// Update the plugma.pluginVersion field in the package.json file
			const packageJsonData = await fs.readFile(packageJsonPath, 'utf8');
			const packageJson = JSON.parse(packageJsonData);
			packageJson.plugma.pluginVersion = `${newVersion}`;

			await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
			console.log(`Stable release: Incrementing version to ${newTag} and updating package.json`);
		} catch (err) {
			console.error(`Error updating package.json:`, err);
			process.exit(1);
		}
	} else {
		// For alpha or beta releases, start at .0 or increment the subversion
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
		try {
			// Update the plugma.pluginVersion field in the package.json file to reflect the alpha/beta version
			const packageJsonData = await fs.readFile(packageJsonPath, 'utf8');
			const packageJson = JSON.parse(packageJsonData);
			packageJson.plugma.pluginVersion = `${version}-${releaseType}.${subVersion}`;

			await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
			console.log(`Pre-release (${releaseType}): Incrementing version to ${newTag} and updating package.json`);
		} catch (err) {
			console.error(`Error updating package.json:`, err);
			process.exit(1);
		}
	}

	// Check if the tag already exists
	try {
		const existingTag = execSync(`git tag -l "${newTag}"`, { encoding: 'utf8' }).trim();
		if (existingTag) {
			console.error(`Tag ${newTag} already exists! Please choose a different version.`);
			process.exit(1);
		}
	} catch (err) {
		console.error('Error checking existing tags:', err);
		process.exit(1);
	}

	// Stage the package.json file, create a commit, and push it
	try {
		execSync('git add package.json', { stdio: 'inherit' });
		execSync(`git commit -m "Release ${newTag}"`, { stdio: 'inherit' });
		console.log('Successfully committed the updated package.json');
	} catch (err) {
		console.error('Error committing the package.json file:', err);
		process.exit(1);
	}

	// Create the git tag and push it to the remote repository
	try {
		execSync(`git tag ${newTag}`, { stdio: 'inherit' });
		execSync(`git push origin ${newTag}`, { stdio: 'inherit' });
		execSync('git push', { stdio: 'inherit' });
		console.log(`Successfully tagged and pushed: ${newTag}`);
	} catch (err) {
		console.error('Error creating or pushing the tag:', err);
		process.exit(1);
	}
}
