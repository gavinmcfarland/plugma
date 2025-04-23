import type { Plugin } from 'vite'
import { NormalizedOutputOptions } from 'rollup'
import fs from 'node:fs'
import path from 'node:path'

/**
 * A Vite plugin that renames the index.html output to ui.html during the build process.
 * This ensures compatibility with Figma's plugin system which expects a ui.html file.
 *
 * @returns A Vite plugin configuration object
 */
export function renameIndexHtml(): Plugin {
	return {
		name: 'plugma:rename-index-html',
		apply: 'build',

		generateBundle(options: NormalizedOutputOptions, bundle: any) {
			// This ensures the bundle is generated
			return bundle
		},

		closeBundle() {
			// Get the output directory from Vite's config
			const outDir = 'dist' // You might want to make this configurable

			const indexPath = path.join(outDir, 'index.html')
			const uiPath = path.join(outDir, 'ui.html')

			if (fs.existsSync(indexPath)) {
				// Read the index.html content
				const content = fs.readFileSync(indexPath, 'utf-8')
				// Write it to ui.html
				fs.writeFileSync(uiPath, content)
				// Remove the original index.html
				fs.unlinkSync(indexPath)
			}
		},
	}
}

export default renameIndexHtml
