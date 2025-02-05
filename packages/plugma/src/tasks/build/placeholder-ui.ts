import type {
	GetTaskTypeFor,
	PluginOptions,
	ResultsOfTask,
} from '#core/types.js';
import { getDirName } from '#utils/get-dir-name.js';
import { Logger } from '#utils/log/logger.js';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path, { dirname, join, resolve } from 'node:path';
import { GetFilesTask } from '../common/get-files.js';
import { task } from '../runner.js';

const plugmaRoot = path.join(getDirName(), '../../..');
const templatePath = path.join(plugmaRoot, 'dist/apps/figma-bridge.html');

/**
 * Result type for the build-placeholder-ui task
 */
interface BuildPlaceholderUiTaskResult {
  /** Path to the built UI HTML file */
  outputPath: string | undefined;
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
 *   manifest: {          // Plugin manifest data (injected by create-vite-configs)
 *     name: string;
 *     main?: string;
 *     ui?: string;
 *     api: string;
 *   }
 * };
 * ~~~
 *
 * The task flow:
 * 1. Verifies UI file exists in manifest
 * 2. Reads the bridge template from dist/apps/figma-bridge.html
 * 3. Injects runtime configuration at the start of the file
 * 4. Creates the development UI file in the output directory
 *
 * @param options - Plugin build options including command, output path, etc
 * @param context - Task context containing results from previous tasks
 * @returns Object containing the output file path
 */
const buildPlaceholderUi = async (
  options: PluginOptions,
  context: ResultsOfTask<GetFilesTask>,
): Promise<BuildPlaceholderUiTaskResult> => {
  const logger = new Logger({
    debug: options.debug,
    prefix: 'build:placeholder-ui',
  });

  logger.debug('Starting build:placeholder-ui task...', {
    templatePath,
    outputDir: options.output,
  });

  if (!context[GetFilesTask.name]) {
    throw new Error('get-files task must run first');
  }

  const { files } = context[GetFilesTask.name];
  logger.debug('Task context loaded', {
    manifest: files.manifest,
    hasUI: !!files.manifest.ui,
  });

  // Only create if UI specified AND file exists
  if (files.manifest.ui) {
    const uiPath = resolve(files.manifest.ui);
    const fileExists = await access(uiPath)
      .then(() => true)
      .catch(() => false);

    if (fileExists) {
      const outputPath: string = join(options.output || 'dist', 'ui.html');
      logger.debug(`Creating placeholder UI for ${files.manifest.ui}...`, {
        uiPath,
        outputPath,
      });

      try {
        // Inject runtime data
        const runtimeData = `<script>\nwindow.runtimeData = ${JSON.stringify(options, null, 2)};\n</script>`;
        logger.debug('Runtime data prepared', {
          command: options.command,
          mode: options.mode,
          port: options.port,
        });

        const template = runtimeData + (await readFile(templatePath, 'utf-8'));
        logger.debug('Template loaded and runtime data injected');

        // Create output directory and write file
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, template, 'utf-8');
        logger.success('Placeholder UI created successfully');
        return { outputPath };
      } catch (error) {
        // Ensure we're always working with Error instances
        const err = error instanceof Error ? error : new Error(String(error));

        // For ENOENT, we want to provide a more user-friendly message
        if (err.message.includes('ENOENT')) {
          err.message = 'Template file not found';
        }

        // Log the error and rethrow
        logger.error('Failed to create placeholder UI:', err);
        throw err;
      }
    } else {
      logger.debug(`UI file not found at ${uiPath}, skipping placeholder UI`);
      return { outputPath: undefined };
    }
  } else {
    logger.debug('No UI specified in manifest, skipping placeholder UI');
    return { outputPath: undefined };
  }
};
export const BuildPlaceholderUiTask = task(
  'build:placeholder-ui',
  buildPlaceholderUi,
);
export type BuildPlaceholderUiTask = GetTaskTypeFor<
  typeof BuildPlaceholderUiTask
>;

export default BuildPlaceholderUiTask;
