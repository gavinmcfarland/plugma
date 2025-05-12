/**
 * Build command implementation
 * Handles production builds and watch mode for plugin development
 */

import { type ManifestFile } from '../core/types.js'
import { createBuildMainTask } from '../tasks/build-main.js'
import { createBuildManifestTask, BuildManifestResult } from '../tasks/build-manifest.js'
import { createBuildUiTask } from '../tasks/build-ui.js'
import { Listr, ListrLogger, ListrLogLevels } from 'listr2'
import { BuildCommandOptions } from '../utils/create-options.js'
import { Timer } from '../utils/timer.js'
import { showPlugmaPrompt } from '../utils/show-plugma-prompt.js'
import { DEFAULT_RENDERER_OPTIONS, SILENT_RENDERER_OPTIONS } from '../constants.js'
import { createDebugAwareLogger } from '../utils/debug-aware-logger.js'
interface BuildContext {
	shown?: boolean
	raw?: ManifestFile
	processed?: ManifestFile
	manifestDuration?: number
	mainDuration?: number
	uiDuration?: number
}

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
	const logger = createDebugAwareLogger(options.debug)

	await showPlugmaPrompt()

	const timer = new Timer()
	timer.start()

	const tasks = new Listr(
		[
			createBuildManifestTask<BuildContext>(options),
			createBuildMainTask<BuildContext>(options),
			createBuildUiTask<BuildContext>(options),
		],
		{
			concurrent: true,
			...(options.debug ? DEFAULT_RENDERER_OPTIONS : SILENT_RENDERER_OPTIONS),
		},
	)

	try {
		await tasks.run()
		timer.stop()
		logger.log(ListrLogLevels.COMPLETED, `Build completed in ${timer.getDuration()} ms`)
		process.exit(0)
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error))
		logger.log(ListrLogLevels.FAILED, err.message)
		process.exit(1)
	}
}
