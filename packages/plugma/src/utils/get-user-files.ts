import path from 'node:path'
import { readJson, readModule } from './fs/read-json.js'
import type { ManifestFile, UserFiles } from '../core/types.js'
import { MANIFEST_FILE_NAMES } from '../core/manifest-paths.js'

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

	// Try each manifest file in order
	let manifest: ManifestFile | null = null
	for (const fileName of MANIFEST_FILE_NAMES) {
		console.log('fileName', fileName)
		if (fileName === 'package.json') {
			manifest = userPkgJson?.plugma?.manifest || null
		} else if (fileName.endsWith('.ts')) {
			manifest = await readModule<ManifestFile>(path.resolve(options.cwd, fileName), true)
		} else if (fileName.endsWith('.js')) {
			manifest = await readModule<ManifestFile>(path.resolve(options.cwd, fileName), true)
		} else if (fileName.endsWith('.json')) {
			manifest = await readJson<ManifestFile>(path.resolve(options.cwd, fileName), true)
		}
		if (manifest) break
	}

	console.log('manifest', manifest)

	if (!manifest) throw new Error('No manifest found in manifest.ts, manifest.js, manifest.json, or package.json')

	return { manifest, userPkgJson, rawManifest: manifest }
}
