import path from 'node:path'
import { readJson } from './fs/read-json.js'

import type { ManifestFile, PluginOptions, UserFiles } from '../core/types.js'
import { transformManifest } from './transform-manifest.js'
import { colorStringify } from './index.js'

/**
 * Gets the plugin's configuration files and settings
 *
 * @param options - Plugin configuration options
 * @returns Object containing:
 *   - manifest: The plugin manifest data, either from manifest.json or package.json
 *   - userPkg: The contents of package.json if it exists
 *
 * The function first attempts to read from manifest.json. If not found,
 * it falls back to reading the manifest from package.json's plugma.manifest field.
 * The manifest object is transformed to handle special cases like networkAccess.
 *
 * @throws Error if no manifest is found in either location
 *
 */

export const getUserFiles = async (options: any): Promise<UserFiles> => {
	const userPkgJson = await readJson<UserFiles['userPkgJson']>(path.resolve(options.cwd, 'package.json'))
	const manifestFile = await readJson<ManifestFile>(path.resolve(options.cwd, 'manifest.json'), true)
	const manifest = manifestFile || userPkgJson?.plugma?.manifest

	if (!userPkgJson) throw new Error('package.json not found')
	if (!manifest) throw new Error('No manifest found in manifest.json or package.json')

	return { manifest, userPkgJson, rawManifest: manifest }
}
