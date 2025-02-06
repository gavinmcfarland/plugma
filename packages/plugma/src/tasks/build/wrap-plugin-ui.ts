import type {
  GetTaskTypeFor,
  PluginOptions,
  ResultsOfTask,
} from '#core/types.js';
import { Logger } from '#utils/log/logger.js';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { GetFilesTask } from '../common/get-files.js';
import { task } from '../runner.js';

/**
 * Result type for the build:wrap-plugin-ui task
 */
interface WrapPluginUiTaskResult {
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
const wrapPluginUi = async (
  options: PluginOptions,
  context: ResultsOfTask<GetFilesTask>,
): Promise<WrapPluginUiTaskResult> => {
  const logger = new Logger({
    debug: options.debug,
    prefix: 'build:wrap-plugin-ui',
  });

  if (!context[GetFilesTask.name]) {
    throw new Error('get-files task must run first');
  }

  const { files } = context[GetFilesTask.name];

  if (!files.manifest.ui) {
    logger.debug(
      'No UI specified in manifest, skipping build:wrap-plugin-ui task',
    );
    return { outputPath: undefined };
  }

  const uiPath = files.manifest.ui;
  const outputPath = join(options.output || 'dist', 'ui.html');
  const templatePath = join(
    options.cwd || process.cwd(),
    'dist',
    'apps',
    'figma-bridge.html',
  );

  try {
    // Check if UI file exists
    try {
      await access(uiPath);
    } catch (error) {
      logger.debug(
        `UI file not found at ${uiPath}, skipping build:wrap-plugin-ui task`,
      );
      return { outputPath: undefined };
    }

    logger.debug(`Wrapping user plugin UI: ${uiPath}...`);

    // Check if template exists and read it
    let templateContent: string;
    try {
      templateContent = await readFile(templatePath, 'utf-8');
    } catch (error) {
      const err = new Error('Template file not found');
      logger.error('Failed to wrap user plugin UI:', err);
      throw err;
    }

    // Validate template
    if (!templateContent.includes('<body>')) {
      const err = new Error('Invalid template file: missing <body> tag');
      logger.error('Failed to wrap user plugin UI:', err);
      throw err;
    }

    // Inject runtime data
    const runtimeData = `<script>\nwindow.runtimeData = ${JSON.stringify(
      options,
      null,
      2,
    )};\n</script>`;
    logger.debug('Runtime data prepared', {
      command: options.command,
      mode: options.mode,
      port: options.port,
    });

    // Read user's UI content
    const userUiContent = await readFile(uiPath, 'utf-8');
    logger.debug('User UI content loaded');

    // Replace placeholder in template with user's UI content
    const template =
      runtimeData +
      templateContent.replace('<!-- UI_CONTENT -->', userUiContent);
    logger.debug('Template loaded and runtime data injected');

    // Create output directory and write file
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, template, 'utf-8');
    logger.success('Wrapped plugin UI created successfully');

    return { outputPath };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'Template file not found' ||
        error.message === 'Invalid template file: missing <body> tag')
    ) {
      throw error;
    }
    logger.error('Failed to wrap user plugin UI:', error);
    throw error;
  }
};

export const WrapPluginUiTask = task('build:wrap-plugin-ui', wrapPluginUi);
export type WrapPluginUiTask = GetTaskTypeFor<typeof WrapPluginUiTask>;

export default WrapPluginUiTask;
