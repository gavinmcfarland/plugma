/**
 * Task to manage plugin version in package.json
 * Handles version updates for stable releases and alpha/beta pre-releases
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Custom error class for version update operations
 */
export class VersionUpdateError extends Error {
  constructor(
    message: string,
    public code:
      | 'INVALID_VERSION'
      | 'INVALID_RELEASE_TYPE'
      | 'FILE_ERROR'
      | 'PARSE_ERROR',
  ) {
    super(message);
    this.name = 'VersionUpdateError';
  }
}

/**
 * Release type for version updates
 */
export type ReleaseType = 'stable' | 'alpha' | 'beta';

/**
 * Options for version update
 */
export interface VersionUpdateOptions {
  /** Manual version override */
  version?: string;
  /** Type of release */
  type?: ReleaseType;
}

/**
 * Result of version update operation
 */
export interface VersionUpdateResult {
  /** Previous version */
  previousVersion: string;
  /** New version */
  newVersion: string;
  /** New version tag (v prefix) */
  newTag: string;
  /** Whether this was a new plugin initialization */
  wasInitialized: boolean;
  /** Type of release */
  releaseType: ReleaseType;
}

/**
 * Validates version format
 * Versions can be either:
 * - A whole number (e.g. "1", "42")
 * - A number with alpha/beta suffix (e.g. "1-alpha.0", "42-beta.5")
 */
function validateVersion(version: string): boolean {
  return /^\d+(?:-(alpha|beta)\.\d+)?$/.test(version);
}

/**
 * Updates plugin version in package.json
 * Handles stable releases and alpha/beta pre-releases
 *
 * @throws {VersionUpdateError} If version update fails
 */
export async function versionUpdate(
  options: VersionUpdateOptions = {},
): Promise<VersionUpdateResult> {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const releaseType = options.type || 'stable';

  try {
    // Read and parse package.json
    const packageJsonData = await fs.readFile(packageJsonPath, 'utf8');
    let packageJson: any;
    try {
      packageJson = JSON.parse(packageJsonData);
    } catch (err) {
      throw new VersionUpdateError(
        `Invalid package.json: ${err instanceof Error ? err.message : 'Parse error'}`,
        'PARSE_ERROR',
      );
    }

    // Initialize plugma section if needed
    let wasInitialized = false;
    if (!packageJson.plugma) {
      packageJson.plugma = {};
      wasInitialized = true;
    }
    if (!packageJson.plugma.pluginVersion) {
      packageJson.plugma.pluginVersion = '0';
      wasInitialized = true;
    }

    const currentVersion = packageJson.plugma.pluginVersion;
    let newVersion: string;

    // Handle manual version override
    if (options.version) {
      if (!validateVersion(options.version)) {
        throw new VersionUpdateError(
          'Invalid version format. Version must be a whole number or number with alpha/beta suffix (e.g. "1", "42", "1-alpha.0", "42-beta.5")',
          'INVALID_VERSION',
        );
      }
      newVersion = options.version;
    } else {
      // Handle automatic version updates
      switch (releaseType) {
        case 'stable': {
          // For stable releases, just increment the number
          const currentNum = Number.parseInt(currentVersion.split('-')[0], 10);
          newVersion = (currentNum + 1).toString();
          break;
        }
        case 'alpha':
        case 'beta': {
          // Extract base version and check for existing pre-release
          const [baseVersion, preRelease] = currentVersion.split('-');
          if (preRelease) {
            // If already a pre-release, increment sub-version
            const [type, subVersion] = preRelease.split('.');
            if (type === releaseType) {
              // Same type, increment sub-version
              newVersion = `${baseVersion}-${type}.${Number.parseInt(subVersion, 10) + 1}`;
            } else {
              // Different type, start at 0
              newVersion = `${baseVersion}-${releaseType}.0`;
            }
          } else {
            // Start new pre-release at 0
            newVersion = `${baseVersion}-${releaseType}.0`;
          }
          break;
        }
        default:
          throw new VersionUpdateError(
            `Invalid release type: ${releaseType}. Must be 'stable', 'alpha', or 'beta'.`,
            'INVALID_RELEASE_TYPE',
          );
      }

      // Validate generated version
      if (!validateVersion(newVersion)) {
        throw new VersionUpdateError(
          `Generated invalid version: ${newVersion}`,
          'INVALID_VERSION',
        );
      }
    }

    // Update package.json
    packageJson.plugma.pluginVersion = newVersion;
    await fs.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2),
      'utf8',
    );

    return {
      previousVersion: currentVersion,
      newVersion,
      newTag: `v${newVersion}`,
      wasInitialized,
      releaseType,
    };
  } catch (err) {
    // If it's already our custom error, rethrow it
    if (err instanceof VersionUpdateError) {
      throw err;
    }

    // Handle file system errors
    throw new VersionUpdateError(
      `Failed to update version: ${err instanceof Error ? err.message : 'Unknown error'}`,
      'FILE_ERROR',
    );
  }
}
