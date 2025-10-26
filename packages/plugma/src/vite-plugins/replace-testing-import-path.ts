/**
 * Vite plugin for replacing "plugma/testing" with the "plugma/testing/figma"
 * when building the plugin.
 */

import path from 'node:path'

import type { Plugin } from 'vite'

import { getDirName } from '../utils/get-dir-name.js'
import { createDebugAwareLogger } from '../utils/debug-aware-logger.js'
import { ListrLogLevels } from 'listr2'

/**
 * Creates a Vite plugin that injects our test framework
 */
export function replacePlugmaTesting(options: any): Plugin {
	const logger = createDebugAwareLogger(options.debug)
	return {
		name: 'plugma:replace-testing-import-path',
		enforce: 'pre',

		resolveId(id: string) {
			// Intercept plugma/vitest imports
			if (id === 'plugma/vitest') {
				logger.log(ListrLogLevels.OUTPUT, [
					'intercepting plugma/vitest import',
					getDirName(),
					'../testing/figma/index.js',
				])
				return path.resolve(getDirName(), '../testing/figma/vitest/index.js')
			}
			// // Intercept plugma/playwright imports
			// if (id === 'plugma/playwright') {
			// 	console.log(
			// 		'intercepting plugma/playwright import',
			// 		getDirName(),
			// 		'../testing/figma/playwright/index.js',
			// 	)
			// 	return path.resolve(getDirName(), '../testing/figma/playwright/index.js')
			// }
		},
	}
}
