import { resolve } from 'node:path';

export const MANIFEST_FILE_NAMES = ['manifest.ts', 'manifest.js', 'manifest.json', 'package.json'] as const;

export function getManifestPaths(cwd: string): string[] {
	return MANIFEST_FILE_NAMES.map((fileName) => resolve(cwd, fileName));
}
