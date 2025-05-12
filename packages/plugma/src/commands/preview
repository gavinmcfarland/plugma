/**
 * Preview command implementation
 * Handles preview server for testing plugin builds
 */

import type { PluginOptions } from '../core/types.js'
import {
	BuildMainTask,
	BuildManifestTask,
	GetFilesTask,
	ShowPlugmaPromptTask,
	StartViteServerTask,
	StartWebSocketsServerTask,
	WrapPluginUiTask,
} from '../tasks/index.js'
import { Logger } from '../utils/log/logger.js'
import { serial } from '../tasks/runner.js'
import { setConfig } from '../utils/save-plugma-cli-options.js'
import { createOptions, PreviewCommandOptions } from '../utils/create-options.js'

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
	const log = new Logger({ debug: options.debug })

	try {
		log.info('Starting preview server...')

		setConfig(options)

		// Execute tasks in sequence
		log.info('Executing tasks...')
		await serial(
			GetFilesTask,
			ShowPlugmaPromptTask,
			BuildManifestTask,
			WrapPluginUiTask,
			BuildMainTask,
			StartWebSocketsServerTask,
			StartViteServerTask,
		)(options)

		log.success('Preview server started successfully')
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		log.error('Failed to start preview server:', errorMessage)
		throw error
	}
}
