/**
 * Build command implementation
 * Handles production builds and watch mode for plugin development
 */

import type { PluginOptions } from '#core/types.js'
import EnsureDistTask from '#tasks/create-ouput-dir.js'
import { Logger } from '#utils/log/logger.js'
import { nanoid } from 'nanoid'
import { BuildMainTask } from '../tasks/build-main.js'
import { BuildManifestTask } from '../tasks/build-manifest.js'
import { BuildUiTask } from '../tasks/build-ui.js'
import { GetFilesTask } from '../tasks/get-files.js'
import { ShowPlugmaPromptTask } from '../tasks/show-plugma-prompt.js'
import { serial } from '../tasks/runner.js'
import type { BuildCommandOptions } from './types.js'

/**
 * Main build command implementation
 * Creates production-ready builds of the plugin
 *
 * @param options - Build configuration options
 * @remarks
 * The build command creates optimized production builds:
 * - Minified and optimized code
 * - Production UI build
 * - Manifest generation
 * - Optional watch mode for development
 */
export async function build(options: BuildCommandOptions): Promise<void> {
	const log = new Logger({ debug: options.debug })

	try {
		log.info('Starting production build...')
		log.debug(`Build options: ${JSON.stringify(options)}`)

		const pluginOptions: PluginOptions = {
			...options,
			mode: options.mode || 'production',
			instanceId: nanoid(),
			port: 3000, // Build command doesn't need a port, but it's required by PluginOptions
			output: options.output || 'dist',
			command: 'build',
		}

		const results = await serial(
			ShowPlugmaPromptTask,
			EnsureDistTask, // ensures a clean dist directory
			BuildManifestTask, // creates a manifest
			BuildUiTask, // copies and transforms UI
			BuildMainTask, // builds the main script
		)(pluginOptions)

		// log.debug(`Task execution results: ${JSON.stringify(results, null, 2)}`);

		// log.success('Production build completed successfully')
		// process.exit(0)
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		log.error('Failed to build plugin:', errorMessage)
		throw error
	}
}
