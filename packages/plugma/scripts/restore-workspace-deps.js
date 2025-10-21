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
 * Restore create-plugma dependency to workspace:* after publishing
 */
async function restoreWorkspaceDependency() {
	try {
		const packageJsonContent = await readFile(packageJsonPath, 'utf8');
		const packageJson = JSON.parse(packageJsonContent);

		if (!packageJson.dependencies || !packageJson.dependencies['create-plugma']) {
			console.warn('⚠️ create-plugma dependency not found in package.json');
			return;
		}

		const currentDep = packageJson.dependencies['create-plugma'];

		// Only restore if it's not already workspace:*
		if (currentDep !== 'workspace:*') {
			packageJson.dependencies['create-plugma'] = 'workspace:*';
			await writeFile(packageJsonPath, JSON.stringify(packageJson, null, '\t') + '\n');
			console.log(`✅ Restored create-plugma dependency from "${currentDep}" to "workspace:*"`);

			// Create a follow-up commit to restore workspace:* reference
			try {
				const { stdout: status } = await execAsync('git status --porcelain package.json');
				if (status.trim()) {
					await execAsync('git add package.json');
					await execAsync('git commit -m "chore: restore workspace dependency reference [skip ci]" --no-verify');
					console.log('✅ Created commit to restore workspace:* reference');
					console.log('');
					console.log('📤 Next steps:');
					console.log('   1. Review the commits and tags created');
					console.log('   2. Push to remote: git push && git push --tags');
					console.log('');
				}
			} catch (gitError) {
				console.warn('⚠️ Could not create git commit (this is OK if not using git):', gitError.message);
			}
		} else {
			console.log(`ℹ️ create-plugma dependency is already set to "workspace:*"`);
		}
	} catch (error) {
		console.error('❌ Error restoring workspace dependency:', error);
		// Don't throw - we don't want to fail the publish if restoration fails
	}
}

async function main() {
	console.log('📦 Restoring workspace dependencies after publish...');
	await restoreWorkspaceDependency();
}

main().catch((error) => {
	console.error('Warning: Failed to restore workspace dependencies:', error);
	// Exit with 0 so publish doesn't fail
	process.exit(0);
});

