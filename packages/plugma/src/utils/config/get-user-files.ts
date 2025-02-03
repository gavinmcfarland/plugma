import path from 'node:path';

import type { ManifestFile, PluginOptions, UserFiles } from '#core/types';
import { readJson, readUserPackageJson } from '#utils';
import { transformObject } from './transform-object.js';

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
 * Tracking:
 * - [x] Add manifest loading
 *   - Verified manifest handling:
 *   - Primary manifest.json support
 *   - Fallback to package.json plugma.manifest
 *   - Proper error handling for missing files
 * - [x] Implement validation
 *   - Verified validation features:
 *   - Required fields checking (main/ui)
 *   - Name field warning
 *   - Proper error messages
 * - [x] Add configuration transformation
 *   - Verified transformation:
 *   - Network access configuration
 *   - Port replacement in domains
 *   - Deep object cloning
 * - [x] Handle file resolution
 *   - Verified resolution features:
 *   - Workspace root resolution
 *   - Package.json parsing
 *   - Proper path handling
 */

export async function getUserFiles(options: PluginOptions): Promise<UserFiles> {
  try {
    // Replace existing package.json reading code with:
    const userPkgJson = await readUserPackageJson(options.cwd);

    if (!userPkgJson) {
      throw new Error('package.json not found');
    }

    let rootManifest: ManifestFile | undefined;

    try {
      // Try reading standalone manifest first
      const manifestPath = path.resolve(
        options.cwd || process.cwd(),
        'manifest.json',
      );
      const rawManifest = await readJson<ManifestFile>(manifestPath);
      rootManifest = transformObject(rawManifest, options);
    } catch {}

    if (!rootManifest && !userPkgJson.plugma?.manifest) {
      throw new Error('No manifest found in manifest.json or package.json');
    }

    const manifest =
      rootManifest || transformObject(userPkgJson.plugma?.manifest, options);

    validateManifest(manifest);

    return { manifest, userPkgJson };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to read plugin files');
  }
}
function validateManifest(manifest?: Partial<ManifestFile>) {
  if (!manifest) {
    throw new Error('No manifest found in manifest.json or package.json');
  }

  if (!manifest.main && !manifest.ui) {
    throw new Error('No main or UI file specified');
  }

  if (!manifest.name) {
    console.warn(
      'Plugma: Please specify the name in the manifest. Example: `{ name: "My Plugin" }`',
    );
  }
}
