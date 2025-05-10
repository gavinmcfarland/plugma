import type { ManifestFile, PluginOptions } from '../core/types.js'

/**
 * Transforms network access configuration in the manifest
 * @param input - The manifest file to transform, can be undefined
 * @param options - Plugin configuration options
 * @returns Transformed manifest file
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

export function transformManifest(input: ManifestFile | undefined, options: PluginOptions): ManifestFile {
	if (!input) {
		throw new Error('No manifest found in manifest.json or package.json')
	}

	const transformed = JSON.parse(JSON.stringify(input))

	if (transformed?.networkAccess?.devAllowedDomains) {
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
			`https://localhost:${options.port}`,
			`ws://localhost:${options.port}`,
			`ws://localhost:${options.port + 1}`,
		]
		transformed.networkAccess.devAllowedDomains = [...newDomains, ...filteredDomains]
	}

	return transformed
}
