/**
 * Build command implementation
 * Handles production builds and watch mode for plugin development
 */

import type { PluginOptions } from '../core/types.js'
import EnsureDistTask from '../tasks/create-ouput-dir.js'
import { Logger } from '../utils/log/logger.js'
import { nanoid } from 'nanoid'
import { BuildMainTask } from '../tasks/build-main.js'
import { BuildManifestTask } from '../tasks/build-manifest.js'
import { BuildUiTask } from '../tasks/build-ui.js'
import { GetFilesTask } from '../tasks/get-files.js'
import { ShowPlugmaPromptTask } from '../tasks/show-plugma-prompt.js'
import { serial } from '../tasks/runner.js'
import { BuildCommandOptions, createOptions } from '../utils/create-options.js'
import { getRandomPort } from '../utils/get-random-port.js'

/**
 * Calculates the total build duration from an array of duration strings
 * @param durations - Array of duration strings in milliseconds
 * @returns The total build duration in milliseconds
 */
function calculateBuildDuration(durations: (string | undefined)[]): number {
	return durations.reduce((total, duration) => {
		return total + (duration ? parseInt(duration) : 0)
	}, 0)
}

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

		const results = await serial(ShowPlugmaPromptTask, BuildManifestTask, BuildMainTask, BuildUiTask)(options)

		console.log(
			`Built in ${calculateBuildDuration([results['build:ui']?.duration, results['build:main']?.duration])}ms`,
		)

		process.exit(0)
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		log.error('Failed to build plugin:', errorMessage)
		throw error
	}
}
