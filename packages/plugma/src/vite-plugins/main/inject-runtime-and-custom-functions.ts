import type { PluginOptions } from '../../core/types.js'
import type { Plugin } from 'vite' // vite.config.js

/**
 * Creates a Vite plugin that injects runtime code after all transformations.
 * This ensures our runtime code isn't affected by Vite's Figma API replacements.
 * There have been several issues getting this to work. The problem is primarily
 * that we need to prevent vite from removing the functions during tree-shaking because
 * these functions aren't actually referenced in the code.
 */

export function injectRuntime(customFunctions: string, pluginOptions: PluginOptions): Plugin {
	return {
		name: 'plugma-plugin',
		resolveId(id) {
			if (id === 'virtual:plugma') {
				return id
			}
		},

		load(id) {
			if (id === 'virtual:plugma') {
				return `const runtimeData = ${JSON.stringify(pluginOptions, null, 2)};

				${customFunctions}`
			}
		},
		transform(code, id) {
			// Skip non-source files early
			if (!id.endsWith('.ts') && !id.endsWith('.js')) {
				return null
			}

			// Skip if no replacement needed
			if (!code.includes('figma.showUI') && !code.includes('figma.ui.resize')) {
				return null
			}

			// Only transform the specific lines that need it
			const codeToReplace = code
				.replace(/figma\.showUI\(([\s\S]*?)\)/g, 'customFunctions.customShowUI($1)')
				.replace(/figma\.ui\.resize\(([\s\S]*?)\)/g, 'customFunctions.customResize($1)')

			// Add the import only if we actually made replacements
			if (codeToReplace !== code) {
				let newCode = `import * as customFunctions from 'virtual:plugma';\n${codeToReplace}`
				return {
					code: newCode,
					map: null,
				}
			}

			return null
		},
	}
}
