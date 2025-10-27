import type { PlugmaPackageJson, UserPackageJson } from '../../core/types.js';
import { promises as fsPromises } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { loadConfigFromFile } from 'vite';

/**
 * Reads and parses a JSON file asynchronously.
 * This function provides type-safe JSON parsing with comprehensive error handling.
 *
 * @template T - The expected type of the parsed JSON data
 * @param filePath - Absolute or relative path to the JSON file
 * @param throwOnNotFound - Whether to throw an error if the file doesn't exist
 * @returns Promise that resolves to the parsed JSON object of type T or null if the file doesn't exist
 * @throws {Error} 'Invalid JSON format' if the file contains invalid JSON
 * @throws {Error} Original error for other file system errors
 * @throws {Error} 'Unknown error reading JSON file' for unexpected errors
 *
 * @example
 * ```ts
 * interface Config {
 *   apiKey: string;
 *   endpoint: string;
 * }
 *
 * try {
 *   const config = await readJson<Config>('./config.json');
 *   console.log(config.apiKey);
 * } catch (err) {
 *   console.error('Failed to read config:', err);
 * }
 * ```
 */
export async function readJson<T>(filePath: string, dontThrow: true): Promise<T | null>;
export async function readJson<T>(filePath: string, dontThrow?: false): Promise<T>;
export async function readJson<T>(filePath: string, dontThrow = false): Promise<T | null> {
	try {
		const data = await fsPromises.readFile(filePath, 'utf8');
		return JSON.parse(data);
	} catch (err) {
		if (err instanceof Error) {
			if ('code' in err && (err as any).code === 'ENOENT') {
				if (dontThrow) return null;
				throw new Error('File not found');
			}
			if (err instanceof SyntaxError) {
				throw new Error('Invalid JSON format');
			}
			throw err;
		}
		throw new Error('Unknown error reading JSON file');
	}
}

/**
 * Reads Plugma's own package.json file
 *
 * @param packagePath - Optional path to the package.json file
 * @returns Promise resolving to Plugma's package.json contents
 * @throws {Error} If package.json can't be found or parsed
 */
export async function readPlugmaPackageJson(packagePath?: string): Promise<PlugmaPackageJson> {
	if (packagePath) {
		return readJson<PlugmaPackageJson>(packagePath);
	}

	// Try to find the plugma package.json from different possible locations
	const possiblePaths = [
		join(process.cwd(), 'package.json'), // If running from plugma package directly
		join(process.cwd(), 'packages', 'plugma', 'package.json'), // If running from root
		join(__dirname, '..', '..', '..', 'package.json'), // If running from shared package
	];

	for (const path of possiblePaths) {
		try {
			const pkg = await readJson<PlugmaPackageJson>(path);
			if (pkg && pkg.name === 'plugma') {
				return pkg;
			}
		} catch {
			// Continue to next path
		}
	}

	throw new Error('Could not find plugma package.json');
}

/**
 * Reads user's project package.json file
 *
 * @param cwd - Current working directory to search from
 * @returns Promise resolving to user's package.json contents
 * @throws {Error} If package.json can't be found or parsed
 */
export async function readUserPackageJson(cwd?: string): Promise<UserPackageJson> {
	const searchPath = cwd || process.cwd();
	const userPkgPath = join(searchPath, 'package.json');
	return readJson<UserPackageJson>(userPkgPath);
}

/**
 * Reads and parses a TypeScript or JavaScript file asynchronously.
 * This function provides type-safe parsing of TypeScript/JavaScript files that export a default object.
 *
 * @template T - The expected type of the parsed data
 * @param filePath - Absolute or relative path to the TypeScript/JavaScript file
 * @param dontThrow - Whether to throw an error if the file doesn't exist
 * @returns Promise that resolves to the parsed object of type T or null if the file doesn't exist
 * @throws {Error} 'Invalid module format' if the file doesn't export a default object
 * @throws {Error} Original error for other file system errors
 * @throws {Error} 'Unknown error reading file' for unexpected errors
 */
export async function readModule<T>(filePath: string, dontThrow = false): Promise<T | null> {
	try {
		// Resolve to absolute path
		const resolvedPath = resolve(filePath);

		// Use Vite's config loader to handle TypeScript files
		// This avoids dependency on jiti and leverages Vite's existing infrastructure
		const result = await loadConfigFromFile({ command: 'build', mode: 'development' }, resolvedPath, process.cwd());

		if (!result) {
			throw new Error('Failed to load module');
		}

		// Vite's loadConfigFromFile wraps the config in a wrapper object
		// We need to get the actual exported default value
		const module = result.config as any;
		
		// Check if the config has a default export
		if (!module || typeof module !== 'object') {
			throw new Error('Invalid module format - must export a default object');
		}

		return module as T;
	} catch (err) {
		if (err instanceof Error) {
			const msg = err.message || '';
			// Robustly catch all 'not found' errors
			if (
				('code' in err && (err as any).code === 'ENOENT') ||
				('code' in err && (err as any).code === 'ERR_MODULE_NOT_FOUND') ||
				msg.includes('Cannot find module') ||
				msg.includes('Unknown file extension') ||
				msg.includes('Qualified path resolution failed')
			) {
				if (dontThrow) return null;
				throw new Error('File not found');
			}
			throw err;
		}
		throw new Error('Unknown error reading file');
	}
}
