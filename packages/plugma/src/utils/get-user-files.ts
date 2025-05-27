import path from 'node:path'
import { readJson, readModule } from './fs/read-json.js'
import type { ManifestFile, UserFiles } from '../core/types.js'

/**
 * Gets the plugin's configuration files and settings
 *
 * @param options - Plugin configuration options
 * @returns Object containing:
 *   - manifest: The plugin manifest data from manifest.ts, manifest.js, manifest.json, or package.json
 *   - userPkg: The contents of package.json if it exists
 *
 * The function checks for manifest files in the following order:
 * 1. manifest.ts
 * 2. manifest.js
 * 3. manifest.json
 * 4. package.json's plugma.manifest field
 *
 * @throws Error if no manifest is found in any location
 */
export const getUserFiles = async (options: any): Promise<UserFiles> => {
	const userPkgJson = await readJson<UserFiles['userPkgJson']>(path.resolve(options.cwd, 'package.json'))
	if (!userPkgJson) throw new Error('package.json not found')

	// Try manifest.ts first
	let manifest = await readModule<ManifestFile>(path.resolve(options.cwd, 'manifest.ts'), true)

	// If not found, try manifest.js
	if (!manifest) {
		manifest = await readModule<ManifestFile>(path.resolve(options.cwd, 'manifest.js'), true)
	}

	// If not found, try manifest.json
	if (!manifest) {
		manifest = await readJson<ManifestFile>(path.resolve(options.cwd, 'manifest.json'), true)
	}

	// If still not found, try package.json
	if (!manifest) {
		manifest = userPkgJson?.plugma?.manifest || null
	}

	if (!manifest) throw new Error('No manifest found in manifest.ts, manifest.js, manifest.json, or package.json')

	return { manifest, userPkgJson, rawManifest: manifest }
}
