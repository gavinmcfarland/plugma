import type { Plugin } from 'vite';
import { logWarning } from '../utils/warning-logger.js';

// Track if warning has been shown to avoid spam
let processEnvWarningShown = false;

/**
 * A Vite plugin that detects process.env usage in user code and shows migration warnings
 * This helps users migrate from process.env to import.meta.env for Plugma v2
 */
export function processEnvMigrationWarning(): Plugin {
	return {
		name: 'plugma:process-env-migration-warning',
		enforce: 'pre',

		transform(code: string, id: string) {
			// Skip node_modules and internal files
			if (id.includes('node_modules') || id.includes('plugma/src') || processEnvWarningShown) {
				return null;
			}

			// Check for process.env usage in user code
			const processEnvRegex = /process\.env\./g;
			const matches = code.match(processEnvRegex);

			if (matches && matches.length > 0) {
				processEnvWarningShown = true;

				logWarning('⚠️  Found usage of process.env in your code, which is no longer supported by default.');
				logWarning('You need to:');
				logWarning('1. Update your .env variables to use VITE_ prefix');
				logWarning('2. Change process.env.VARIABLE to import.meta.env.VITE_VARIABLE in your code');
				logWarning('');
				logWarning('Example migration:');
				logWarning('  .env file:');
				logWarning('  - SOME_KEY=123');
				logWarning('  + VITE_SOME_KEY=123');
				logWarning('');
				logWarning('  Your code:');
				logWarning('  - console.log(process.env.SOME_KEY)');
				logWarning('  + console.log(import.meta.env.VITE_SOME_KEY)');
				logWarning('');
				logWarning(
					'See migration guide: https://github.com/gavinmcfarland/plugma/blob/main/docs/migration/v2/README.md',
				);
			}

			return null;
		},
	};
}
