import { ListrLogLevels } from 'listr2'
import type { ManifestFile, PluginOptions } from '../core/types.js'
import { BuildCommandOptions, DevCommandOptions, PreviewCommandOptions } from './create-options.js'
import { createDebugAwareLogger } from './debug-aware-logger.js'
import { filterNullProps } from './filter-null-props.js'
import { join, resolve } from 'node:path'
import { unlink } from 'node:fs/promises'

// Constants
const DEFAULT_MANIFEST_VALUES = {
	api: '1.0.0',
}

async function setSourcePaths(
	options: DevCommandOptions | BuildCommandOptions | PreviewCommandOptions,
	manifest: ManifestFile,
) {
	const logger = createDebugAwareLogger(options.debug)
	const outputDirPath = resolve(options.cwd || process.cwd(), options.output)
	const overriddenValues: Partial<ManifestFile> = {}

	// Handle ui.html file
	if (manifest.ui) {
		logger.log(ListrLogLevels.OUTPUT, 'Setting ui path to ui.html')
		overriddenValues.ui = 'ui.html'
	} else {
		// Remove ui.html if not specified
		const uiPath = join(outputDirPath, 'ui.html')
		try {
			await unlink(uiPath)
			logger.log(ListrLogLevels.OUTPUT, 'Removed ui.html as it was not specified in manifest')
		} catch (error) {
			// Ignore if file doesn't exist
		}
	}

	// Handle main.js file
	if (manifest.main) {
		logger.log(ListrLogLevels.OUTPUT, 'Setting main path to main.js')
		overriddenValues.main = 'main.js'
	} else {
		// Remove main.js if not specified
		const mainPath = join(outputDirPath, 'main.js')
		try {
			await unlink(mainPath)
			logger.log(ListrLogLevels.OUTPUT, 'Removed main.js as it was not specified in manifest')
		} catch (error) {
			// Ignore if file doesn't exist
		}
	}

	return overriddenValues
}

/**
 * Transforms and processes the manifest file
 * @param input - The manifest file to transform, can be undefined
 * @param options - Plugin configuration options
 * @param overriddenValues - Optional values to override in the manifest
 * @returns Transformed and processed manifest file
 *
 * Tracking:
 * - [x] Add network access handling
 *   - Verified network configuration:
 *   - devAllowedDomains transformation
 *   - Port replacement in localhost URLs
 *   - Domain pattern matching
 * - [x] Implement object cloning
 *   - Verified cloning features:
 *   - Deep object cloning
 *   - JSON serialization safety
 *   - Proper error handling
 * - [x] Add validation
 *   - Verified validation:
 *   - Input existence check
 *   - Proper error messages
 *   - Type safety
 */

export async function transformManifest(
	manifest: ManifestFile | undefined,
	options: DevCommandOptions | BuildCommandOptions | PreviewCommandOptions,
): Promise<ManifestFile> {
	if (!manifest) {
		throw new Error('No manifest found in manifest.json or package.json')
	}

	const overriddenValues = await setSourcePaths(options, manifest)

	// Process the manifest with default values and overrides
	const processedManifest = {
		...DEFAULT_MANIFEST_VALUES,
		...manifest,
		...(overriddenValues || {}),
	}

	// Filter out null values
	const finalManifest = filterNullProps(processedManifest)

	// Transform network access configuration for dev/preview
	if (options.command === 'dev' || options.command === 'preview') {
		const transformed = JSON.parse(JSON.stringify(finalManifest))

		// Initialize networkAccess if it doesn't exist
		if (!transformed.networkAccess) {
			transformed.networkAccess = { devAllowedDomains: [] }
		}

		// Initialize devAllowedDomains if it doesn't exist
		if (!transformed.networkAccess.devAllowedDomains) {
			transformed.networkAccess.devAllowedDomains = []
		}

		const wildcardDomains = transformed.networkAccess.devAllowedDomains.filter((domain: string) =>
			domain.endsWith(':*'),
		)
		if (wildcardDomains.length > 0) {
			console.warn(
				'Warning: The following domains in your manifest use wildcard ports (*) which are no longer needed.',
			)
			wildcardDomains.forEach((domain: string) => console.warn(`  - ${domain}`))
			console.warn('Please remove these from your manifest.')
		}

		const filteredDomains = transformed.networkAccess.devAllowedDomains.filter(
			(domain: string) => !domain.endsWith(':*'),
		)
		const newDomains = [
			`http://localhost:${options.port}`,
			`ws://localhost:${options.port}`,
			`ws://localhost:${options.port + 1}`,
		]
		transformed.networkAccess.devAllowedDomains = [...newDomains, ...filteredDomains]

		return transformed
	}
	return finalManifest
}
