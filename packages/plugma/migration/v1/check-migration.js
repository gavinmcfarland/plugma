import { execSync } from 'child_process';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import semver from 'semver';
import chalk from 'chalk';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the migration guide link
const migrationGuideLink = 'https://github.com/gavinmcfarland/plugma/blob/main/packages/plugma/migration/v1/README.md';

// Get the version from the current project's package.json
function getInstalledVersion(packageName) {
	const pkgJsonPath = path.resolve(process.cwd(), 'node_modules', packageName, 'package.json');
	if (fs.existsSync(pkgJsonPath)) {
		const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
		return pkgJson.version;
	}
	return null;
}

// Compare versions and prompt migration
async function checkAndPromptMigration() {
	const installedVersion = getInstalledVersion('plugma'); // Replace with your package name
	const currentVersion = '1.0.0'; // Replace with your current version

	if (installedVersion && semver.major(installedVersion) < semver.major(currentVersion)) {
		// const { proceedWithMigration } = await inquirer.prompt([
		// 	{
		// 		type: 'confirm',
		// 		name: 'proceedWithMigration',
		// 		message: `It looks like you've upgraded Plugma from v${installedVersion} to v${currentVersion}`,
		// 		default: true,
		// 	},
		// ]);

		// if (proceedWithMigration) {
		// Trigger the migration script
		console.warn(
			chalk.bgYellow.bold('\n[Warning]') +
			chalk.yellow(' Upgrading plugma to v1 requires some updates to \nyour vite.config.js for a simpler and cleaner configuration.\n\n') +
			chalk.white('For more information visit: ') +
			chalk.underline(`${migrationGuideLink}\n`)
		);
		execSync(`node ${__dirname}/run-migration.js`, { stdio: 'inherit' });
		// } else {
		// 	console.log(`For more information, visit the migration guide: ${migrationGuideLink}`);
		// }
	}
}

checkAndPromptMigration();
