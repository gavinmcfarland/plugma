import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Load environment variables from .env files
 */
export function loadEnvFiles() {
	// Get the package root directory
	const __dirname = dirname(fileURLToPath(import.meta.url));
	const packageRoot = resolve(__dirname, '..', '..');

	// Load environment variables from .env files
	config({
		path: resolve(packageRoot, '.env'),
	});
}
