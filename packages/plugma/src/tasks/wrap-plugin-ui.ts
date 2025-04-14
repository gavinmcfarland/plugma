import type { GetTaskTypeFor, PluginOptions, ResultsOfTask } from '#core/types.js'
import { createViteConfigs, getDirName, getUserFiles } from '#utils'
import { Logger } from '#utils/log/logger.js'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { GetFilesTask } from '#tasks/get-files.js'
import { task } from '#tasks/runner.js'

/**
 * Result type for the build:wrap-plugin-ui task
 */
interface WrapPluginUiTaskResult {
	/** Path to the built UI HTML file */
	outputPath: string | undefined
}

/**
 * Task that creates a development-mode UI file.
 * This task injects runtime configuration into the Figma bridge template (formerly PluginWindow.html).
 *
 * This task is responsible for:
 * 1. Creating a development UI file that:
 *    - Loads the Figma bridge interface
 *    - Injects runtime configuration
 *    - Provides development-specific features
 * 2. Managing file state:
 *    - Creates output directory if needed
 *    - Validates output files against source files
 *    - Verifies template and UI file existence
 *
 * The development UI is created when:
 * - UI is specified in the manifest
 * - The UI file exists
 * - Running in development mode
 *
 * Runtime data structure:
 * ~~~js
 * window.runtimeData = {
 *   command: string;      // Current command (dev/preview)
 *   debug: boolean;       // Debug mode flag
 *   mode: string;        // Environment mode
 *   output: string;      // Output directory
 *   port: number;        // Dev server port
 *   instanceId: string;  // Unique instance ID
 *   manifest: {          // Plugin manifest data
 *     name: string;
 *     main?: string;
 *     ui?: string;
 *     api: string;
 *   }
 * };
 * ~~~
 *
 * @param options - Plugin build options including command, output path, etc
 * @param context - Task context containing results from previous tasks
 * @returns Object containing the output file path
 */
const wrapPluginUi = async (
	options: PluginOptions,
	context: ResultsOfTask<GetFilesTask>,
): Promise<WrapPluginUiTaskResult> => {
	const logger = new Logger({
		debug: options.debug,
		prefix: 'build:wrap-plugin-ui',
	})

	const files = await getUserFiles(options)

	logger.debug('Task context loaded', {
		manifest: files.manifest,
		hasUI: !!files.manifest.ui,
	})

	// Only create if UI specified AND file exists
	if (files.manifest.ui) {
		const uiPath = resolve(files.manifest.ui)
		const fileExists = await access(uiPath)
			.then(() => true)
			.catch(() => false)

		if (fileExists) {
			const outputPath = join(options.output || 'dist', 'ui.html')
			logger.debug(`Wrapping user plugin UI: ${uiPath}...`, {
				uiPath,
				outputPath,
			})

			try {
				// Add manifest to options like in legacy version
				options.manifest = files.manifest

				// Inject runtime data (prepended like in legacy version)
				const runtimeData = `<script>
        // Global variables defined on the window object
        window.runtimeData = ${JSON.stringify(options, null, 2)};
        </script>`

				logger.debug('Runtime data prepared', {
					command: options.command,
					mode: options.mode,
					port: options.port,
				})

				// Read template and prepend runtime data
				const templatePath = resolve(getDirName(), '../apps/figma-bridge.html')
				let template: string
				try {
					template = await readFile(templatePath, 'utf-8')
				} catch (error) {
					throw new Error(`Template file not found at ${templatePath}`)
				}
				const finalContent = template.replace(/^/, runtimeData)
				logger.debug('Template loaded and runtime data injected')

				// Create output directory and write file
				await mkdir(dirname(outputPath), { recursive: true })
				await writeFile(outputPath, finalContent, 'utf-8')
				logger.success('Wrapped plugin UI created successfully')

				return { outputPath }
			} catch (error) {
				// Log the error and rethrow
				logger.error('Failed to wrap user plugin UI:', error)
				throw error
			}
		} else {
			logger.debug(`UI file not found at ${uiPath}, skipping build:wrap-plugin-ui task`)
			return { outputPath: undefined }
		}
	} else {
		logger.debug('No UI specified in manifest, skipping build:wrap-plugin-ui task')
		return { outputPath: undefined }
	}
}

export const WrapPluginUiTask = task('build:wrap-plugin-ui', wrapPluginUi)
export type WrapPluginUiTask = GetTaskTypeFor<typeof WrapPluginUiTask>

export default WrapPluginUiTask
