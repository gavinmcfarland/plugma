import { join, resolve } from 'node:path';
import { build } from 'vite';
/**
 * Main script build task implementation
 */
import type {
  GetTaskTypeFor,
  PluginOptions,
  ResultsOfTask,
} from '#core/types.js';
// import type { TaskDefinition } from '#core/task-runner/types.js';
import { Logger } from '#utils/log/logger.js';
import { GetFilesTask } from '../common/get-files.js';
import { task } from '../runner.js';
import { viteState } from '../server/vite.js';

/**
 * Result type for the build-main task
 */
interface Result {
  /** Path to the built main script file */
  outputPath: string;
}

/**
 * Task that builds the plugin's main script.
 *
 * This task is responsible for:
 * 1. Building the main script using Vite:
 *    - Configures Vite for IIFE output format
 *    - Sets up Figma API externals
 *    - Handles source maps and minification
 * 2. Managing build state:
 *    - Closes existing build server if any
 *    - Validates output files against source files
 *    - Manages watch mode for development
 *
 * The main script is built from the path specified in manifest.main and outputs to main.js.
 * In development mode:
 * - Builds are not minified for better debugging
 * - Watch mode is enabled for rebuilding on changes
 * - Output files are validated against source files
 *
 * In production mode:
 * - Output is minified
 * - Watch mode is disabled (unless explicitly enabled)
 * - Build artifacts are preserved
 *
 * @param options - Plugin build options including command, output path, etc
 * @param context - Task context containing results from previous tasks
 * @returns Object containing the output file path
 */
const buildMain = async (
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
    const outputPath = join(options.output || 'dist', 'main.js');

    // Close existing build server if any
    if (viteState.viteBuild) {
      await viteState.viteBuild.close();
    }

    // Only build if main script is specified
    if (!files.manifest.main) {
      log.debug('No main script specified in manifest, skipping build');
      return { outputPath };
    }

    const mainPath = resolve(files.manifest.main);
    log.debug(`Building main script from ${mainPath}...`);

    // Build main script with Vite
    await build({
      root: process.cwd(),
      base: '/',
      mode: options.mode,
      build: {
        outDir: options.output || 'dist',
        emptyOutDir: true,
        sourcemap: true,
        minify: options.command === 'build', // Only minify in build command
        lib: {
          entry: mainPath,
          formats: ['iife'],
          name: 'plugin',
          fileName: () => 'main.js',
        },
        rollupOptions: {
          input: mainPath,
          external: ['figma'],
          output: {
            globals: {
              figma: 'figma',
            },
          },
        },
        watch: options.watch ? {} : undefined,
      },
    });

    log.success('Main script built successfully at dist/main.js\n');

    return { outputPath };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to build main script: ${errorMessage}`);
  }
};

export const BuildMainTask = task('build:main', buildMain);
export type BuildMainTask = GetTaskTypeFor<typeof BuildMainTask>;

export default BuildMainTask;
