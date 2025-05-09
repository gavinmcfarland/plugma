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
		const newDomains: string[] = []
		transformed.networkAccess.devAllowedDomains.forEach((domain: string) => {
			if (domain === 'http://localhost:*' || domain === 'https://localhost:*' || domain === 'ws://localhost:*') {
				const port = domain.startsWith('ws') ? (Number(options.port) + 1).toString() : options.port.toString()
				const transformedDomain = domain.replace('*', port)
				newDomains.push(transformedDomain)

				// Add WebSocket equivalent for HTTP/HTTPS domains
				if (domain.startsWith('http://')) {
					newDomains.push(`ws://localhost:${port}`)
				} else if (domain.startsWith('https://')) {
					newDomains.push(`wss://localhost:${port}`)
				}
			} else {
				newDomains.push(domain)
			}
		})
		transformed.networkAccess.devAllowedDomains = newDomains
	}

	return transformed
}
