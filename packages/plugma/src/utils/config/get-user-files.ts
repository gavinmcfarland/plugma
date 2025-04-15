import path from 'node:path'
import { readJson } from '../fs/read-json.js'

import type { ManifestFile, PluginOptions, UserFiles } from '../../core/types.js'
import { transformManifest } from './transform-manifest.js'

function validateManifest(manifest?: Partial<ManifestFile>) {
	if (!manifest) {
		throw new Error('No manifest found in manifest.json or package.json')
	}

	if (!manifest.main && !manifest.ui) {
		throw new Error('No main or UI file specified')
	}

	if (!manifest.name) {
		console.warn('Plugma: Please specify the name in the manifest. Example: `{ name: "My Plugin" }`')
	}
}

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

export async function getUserFiles(options: PluginOptions): Promise<UserFiles> {
	try {
		const userPkgPath = path.resolve(options.cwd, 'package.json')
		const userPkgJson = await readJson<UserFiles['userPkgJson']>(userPkgPath)
		if (!userPkgJson) throw new Error('package.json not found')

		const manifestPath = path.resolve(options.cwd, 'manifest.json')
		const manifestFile = await readJson<ManifestFile>(manifestPath, true)

		const packageManifest = userPkgJson.plugma?.manifest

		if (!manifestFile && !packageManifest) {
			throw new Error('No manifest found in manifest.json or package.json')
		}

		const userManifest = manifestFile || (packageManifest as ManifestFile)

		const processedManifest = transformManifest(userManifest, options)
		validateManifest(processedManifest)

		return { manifest: processedManifest, userPkgJson, rawManifest: userManifest }
	} catch (error) {
		if (error instanceof Error) {
			throw error
		}
		throw new Error('Failed to read plugin files')
	}
}
