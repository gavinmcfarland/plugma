/**
 * Development command implementation
 * Handles development server and file watching for plugin development
 */

import type { DevCommandOptions } from '#commands/types.js'
import {
	BuildMainTask,
	BuildManifestTask,
	GetFilesTask,
	ShowPlugmaPromptTask,
	StartViteServerTask,
	StartWebSocketsServerTask,
	WrapPluginUiTask,
} from '#tasks'
import { serial } from '#tasks/runner.js'
import { Logger } from '#utils/log/logger.js'
import { nanoid } from 'nanoid'
import { getRandomPort } from '../utils/get-random-port.js'
import { SaveOptionsTask } from '#tasks/common/temp-options.js'
import { setTestConfig } from '#utils/set-config.js'

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

		const port = options.port || getRandomPort()

		const pluginOptions = {
			...options,
			mode: options.mode || 'development',
			instanceId: nanoid(),
			port: port,
			output: options.output || 'dist',
			command: 'dev' as const,
			cwd: options.cwd || process.cwd(),
		}

		setTestConfig({ port })

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
		)(pluginOptions)

		log.success('Development server started successfully')
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		log.error('Failed to start development server:', errorMessage)
		throw error
	}
}
