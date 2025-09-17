import type { Plugin } from 'vite';
import { NormalizedOutputOptions } from 'rollup';
import fs from 'node:fs';
import path from 'node:path';

/**
 * A Vite plugin that renames the index.html output to ui.html during the build process.
 * This ensures compatibility with Figma's plugin system which expects a ui.html file.
 *
 * @param outDir - The output directory where the files are located (defaults to 'dist')
 * @returns A Vite plugin configuration object
 */
export function renameIndexHtml(outDir: string = 'dist'): Plugin {
	return {
		name: 'plugma:rename-index-html',
		apply: 'build',

		generateBundle(options: NormalizedOutputOptions, bundle: any, isWrite: boolean) {
			// This ensures the bundle is generated
			return bundle;
		},

		closeBundle() {
			const indexPath = path.join(outDir, 'index.html');
			const virtualUiPath = path.join(outDir, 'virtual:plugma-ui.html');
			const uiPath = path.join(outDir, 'ui.html');

			// Check for virtual:plugma-ui.html first, then fall back to index.html
			if (fs.existsSync(virtualUiPath)) {
				// Read the virtual:plugma-ui.html content
				const content = fs.readFileSync(virtualUiPath, 'utf-8');
				// Write it to ui.html
				fs.writeFileSync(uiPath, content);
				// Remove the original virtual:plugma-ui.html
				fs.unlinkSync(virtualUiPath);
			} else if (fs.existsSync(indexPath)) {
				// Read the index.html content
				const content = fs.readFileSync(indexPath, 'utf-8');
				// Write it to ui.html
				fs.writeFileSync(uiPath, content);
				// Remove the original index.html
				fs.unlinkSync(indexPath);
			}
		},
	};
}

export default renameIndexHtml;
