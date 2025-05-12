import type { DevCommandOptions } from '../utils/create-options.js'
import {
	createBuildMainTask,
	createBuildManifestTask,
	createStartViteServerTask,
	createStartWebSocketsServerTask,
	createWrapPluginUiTask,
} from '../tasks/index.js'
import { setConfig } from '../utils/save-plugma-cli-options.js'
import { showPlugmaPrompt } from '../utils/show-plugma-prompt.js'
import { Listr, ListrLogger, ListrLogLevels, ListrRendererValue } from 'listr2'
import { ManifestFile } from '../core/types.js'
import type { ViteDevServer } from 'vite'
import { DEFAULT_RENDERER_OPTIONS, SILENT_RENDERER_OPTIONS } from '../constants.js'
import { createDebugAwareLogger } from '../utils/debug-aware-logger.js'

interface BuildContext {
	shown?: boolean
	raw?: ManifestFile
	processed?: ManifestFile
	manifestDuration?: number
	mainDuration?: number
	uiDuration?: number
	websocketServer?: any
	viteServer?: ViteDevServer
	vitePort?: number
}

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
	const logger = createDebugAwareLogger(options.debug)

	logger.log(ListrLogLevels.STARTED, 'Starting development server...')

	setConfig(options)

	await showPlugmaPrompt()

	// await serial(
	//  GetFilesTask, Not needed?
	//  SaveOptionsTask, Not needed?
	//  BuildManifestTask, done
	//  BuildMainTask, done
	//  WrapPluginUiTask, done
	//  StartWebSocketsServerTask, done
	//  StartViteServerTask, done
	// )(options)

	const tasks = new Listr(
		[
			createBuildManifestTask<BuildContext>(options),
			createBuildMainTask<BuildContext>(options),
			createWrapPluginUiTask<BuildContext>(options),
			createStartWebSocketsServerTask<BuildContext>(options),
			createStartViteServerTask<BuildContext>(options),
		],
		options.debug ? DEFAULT_RENDERER_OPTIONS : SILENT_RENDERER_OPTIONS,
	)

	try {
		await tasks.run()
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error))
		logger.log(ListrLogLevels.FAILED, ['Failed to start development server:', err])
		process.exit(1)
	}
}
