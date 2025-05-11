import type { DevCommandOptions } from '../utils/create-options.js'
/**
 * Development command implementation
 * Handles development server and file watching for plugin development
 */

import {
	BuildMainTask,
	BuildManifestTask,
	GetFilesTask,
	ShowPlugmaPromptTask,
	StartViteServerTask,
	StartWebSocketsServerTask,
	WrapPluginUiTask,
} from '../tasks/index.js'
import { serial } from '../tasks/runner.js'
import { Logger } from '../utils/log/logger.js'
import { nanoid } from 'nanoid'
import { getRandomPort } from '../utils/get-random-port.js'
import { SaveOptionsTask } from '../tasks/save-cli-options.js'
import { setConfig } from '../utils/save-plugma-cli-options.js'
import { createOptions } from '../utils/create-options.js'

/**
 * Main development command implementation
 * Starts a development server with live reload capabilities
 *
 * @param options - Development configuration options
 * @remarks
 * The dev command sets up a full development environment with:
 * - File watching and live reload
 * - Development UI with placeholder
 * - WebSocket communication
 * - Vite development server
 * - Output file validation to ensure integrity
 */
export async function dev(options: DevCommandOptions): Promise<void> {
	const log = new Logger({ debug: options.debug })

	try {
		log.info('Starting development server...')

		setConfig(options)

		// Execute tasks in sequence
		log.info('Executing tasks...')
		await serial(
			GetFilesTask,
			ShowPlugmaPromptTask,
			SaveOptionsTask,
			BuildManifestTask,
			WrapPluginUiTask,
			BuildMainTask,
			StartWebSocketsServerTask,
			StartViteServerTask,
		)(options)

		log.success('Development server started successfully')
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		log.error('Failed to start development server:', errorMessage)
		throw error
	}
}
