import type {
  GetTaskTypeFor,
  PluginOptions,
  ResultsOfTask,
} from '#core/types.js';
import { registerCleanup } from '#utils/cleanup.js';
import { Logger } from '#utils/log/logger.js';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GetFilesTask } from '../common/get-files.js';
import { task } from '../runner.js';

/**
 * Result type for the build-placeholder-ui task
 */
interface Result {
  /** Path to the built UI HTML file */
  outputPath: string;
}

/**
 * Task that creates a development-mode UI file.
 *
 * This task is responsible for:
 * 1. Creating a development UI file that:
 *    - Loads the Figma bridge interface
 *    - Injects runtime configuration
 *    - Provides development-specific features
 * 2. Managing file state:
 *    - Creates output directory if needed
 *    - Handles cleanup of temporary files
 *    - Verifies template and UI file existence
 *
 * The development UI is created when:
 * - UI is specified in the manifest
 * - The UI file exists
 * - Running in development mode
 *
 * The task:
 * 1. Reads the bridge template
 * 2. Injects runtime configuration
 * 3. Writes the modified file
 * 4. Registers cleanup for temporary files
 *
 * @param options - Plugin build options including command, output path, etc
 * @param context - Task context containing results from previous tasks
 * @returns Object containing the output file path
 */
const buildPlaceholderUi = async (
  options: PluginOptions,
  context: ResultsOfTask<GetFilesTask>,
): Promise<Result> => {
  try {
    const log = new Logger({ debug: options.debug });
    const fileResult = context[GetFilesTask.name];
    if (!fileResult) {
      throw new Error('get-files task must run first');
    }

    const { files } = fileResult;
    const outputPath = join(options.output || 'dist', 'ui.html');

    // Register cleanup handler for development mode
    const cleanup = async () => {
      log.debug('Cleaning up placeholder UI...');
      try {
        await rm(outputPath, { force: true });
        log.success('Cleaned up placeholder UI');
      } catch (error) {
        log.error('Failed to clean up placeholder UI:', error);
      }
    };

    if (options.command !== 'build') {
      registerCleanup(cleanup);
    }

    // Only create if UI specified AND file exists
    if (files.manifest.ui) {
      const uiPath = resolve(files.manifest.ui);
      const fileExists = await access(uiPath)
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        log.debug(`Creating placeholder UI for ${files.manifest.ui}...`);

        // Read template from apps directory
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const templatePath = resolve(
          `${__dirname}/../../../apps/figma-bridge.html`,
        );

        try {
          // Read and verify template
          let htmlContent = await readFile(templatePath, 'utf-8');
          if (!htmlContent.includes('<body>')) {
            throw new Error('Invalid template file: missing <body> tag');
          }

          // Inject runtime data
          const runtimeData = `<script>
            window.runtimeData = ${JSON.stringify({
              ...options,
              manifest: files.manifest,
            })};
          </script>`;
          htmlContent = htmlContent.replace(/^/, runtimeData);

          // Create output directory and write file
          await mkdir(dirname(outputPath), { recursive: true });
          await writeFile(outputPath, htmlContent, 'utf-8');
          log.success('Placeholder UI created successfully');
        } catch (error) {
          if (error instanceof Error && error.message.includes('ENOENT')) {
            throw new Error(`Template file not found: ${templatePath}`);
          }
          throw error;
        }
      } else {
        log.debug(`UI file not found at ${uiPath}, skipping placeholder UI`);
      }
    } else {
      log.debug('No UI specified in manifest, skipping placeholder UI');
    }

    return { outputPath };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to build placeholder UI: ${errorMessage}`);
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
