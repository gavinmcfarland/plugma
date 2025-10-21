import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
		} else {
			console.log(`ℹ️ create-plugma dependency is already set to "workspace:*"`);
		}
	} catch (error) {
		console.error('❌ Error restoring workspace dependency:', error);
		// Don't throw - we don't want to fail the publish if restoration fails
	}
}

async function main() {
	console.log('📦 Restoring workspace dependencies after pack...');
	await restoreWorkspaceDependency();
}

main().catch((error) => {
	console.error('Warning: Failed to restore workspace dependencies:', error);
	// Exit with 0 so publish doesn't fail
	process.exit(0);
});

