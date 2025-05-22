/**
 * Preview command implementation
 * Handles preview server for testing plugin builds
 */

import type { PluginOptions } from '../core/types.js'
import {
	createBuildMainTask,
	createBuildManifestTask,
	createStartViteServerTask,
	createStartWebSocketsServerTask,
	createWrapPluginUiTask,
} from '../tasks/index.js'
import { Logger } from '../utils/log/logger.js'
import { setConfig } from '../utils/save-plugma-cli-options.js'
import { createOptions, PreviewCommandOptions } from '../utils/create-options.js'
import { Listr, ListrLogger, ListrLogLevels } from 'listr2'
import { DEFAULT_RENDERER_OPTIONS, SILENT_RENDERER_OPTIONS } from '../constants.js'
import { createDebugAwareLogger } from '../utils/debug-aware-logger.js'
import chalk from 'chalk'

interface BuildContext {
	raw?: any
	processed?: any
	manifestDuration?: number
	mainDuration?: number
	uiDuration?: number
	websocketServer?: any
	viteServer?: any
	vitePort?: number
}

/**
 * Main preview command implementation
 * Sets up a preview environment for testing built plugins
 *
 * @param options - Preview configuration options
 * @remarks
 * The preview command is similar to dev but optimized for testing:
 * - Uses production-like builds
 * - Includes development server
 * - Supports WebSocket communication
 * - Enables testing plugin functionality
 */
export async function preview(options: PreviewCommandOptions): Promise<void> {
	const logger = createDebugAwareLogger(options.debug)

	logger.log(ListrLogLevels.OUTPUT, 'Starting preview server...')

	setConfig(options)

	const tasks = new Listr(
		[
			createBuildManifestTask<BuildContext>(options),
			createWrapPluginUiTask<BuildContext>(options),
			createBuildMainTask<BuildContext>(options),
			createStartWebSocketsServerTask<BuildContext>(options),
			createStartViteServerTask<BuildContext>(options),
		],
		options.debug ? DEFAULT_RENDERER_OPTIONS : SILENT_RENDERER_OPTIONS,
	)

	try {
		await tasks.run()
		console.log(`\n${chalk.green('✔ Watching for changes...')}`)
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		logger.log(ListrLogLevels.FAILED, ['Failed to start preview server:', errorMessage])
		throw error
	}
}
