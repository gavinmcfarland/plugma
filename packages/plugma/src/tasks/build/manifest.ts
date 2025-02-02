import type {
  GetTaskTypeFor,
  ManifestFile,
  PluginOptions,
  ResultsOfTask,
} from '#core/types.js';
import {
  GetFilesTask,
  type GetFilesTaskResult,
} from '#tasks/common/get-files.js';
import RestartViteServerTask from '#tasks/server/restart-vite.js';
import { registerCleanup } from '#utils/cleanup.js';
import { validateOutputFiles } from '#utils/config/validate-output-files.js';
import { filterNullProps } from '#utils/filter-null-props.js';
import { getFilesRecursively } from '#utils/fs/get-files-recursively.js';
import { defaultLogger as log } from '#utils/log/logger.js';
import chokidar from 'chokidar';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { task } from '../runner.js';
import BuildMainTask from './main.js';

/**
 * Result type for the build-manifest task
 */
export interface BuildManifestResult {
  /** The original manifest file contents before processing */
  raw: ManifestFile;
  /** The processed manifest with defaults and overrides applied */
  processed: ManifestFile;
}

/**
 * Task that generates and maintains the plugin manifest file.
 *
 * This task is responsible for:
 * 1. Creating the initial manifest file with proper defaults and overrides
 * 2. In development mode:
 *    - Watching manifest.json and package.json for changes
 *    - Watching src directory for file additions/removals
 *    - Triggering server restart when needed
 *    - Rebuilding main script when its path changes
 *    - Validating output files against source files
 * 3. In build mode:
 *    - Creating the final manifest for production
 *    - Preserving build artifacts
 *
 * The manifest file is central to the plugin's functionality as it:
 * - Defines the plugin's metadata (name, id, version)
 * - Specifies entry points (main script, UI)
 * - Sets API compatibility version
 *
 * @param options - Plugin build options including command, output path, etc
 * @param context - Task context containing results from previous tasks
 * @returns The raw and processed manifest contents
 */
const buildManifest = async (
  options: PluginOptions,
  context: ResultsOfTask<GetFilesTask>,
): Promise<BuildManifestResult> => {
  try {
    const fileResult = context[GetFilesTask.name];
    if (!fileResult) {
      throw new Error('get-files task must run first');
    }

    const { files } = fileResult;
    let previousMainValue = files.manifest.main;
    const previousUiValue = files.manifest.ui;

    // Initial build
    const result = await _buildManifestFile(options, files);

    // Set up watchers for development mode
    if (
      options.command === 'dev' ||
      options.command === 'preview' ||
      (options.command === 'build' && options.watch)
    ) {
      const manifestPath = resolve('./manifest.json');
      const userPkgPath = resolve('./package.json');
      const srcPath = resolve('./src');
      const existingFiles = new Set<string>();

      // Initialize existing files
      const srcFiles = await getFilesRecursively(srcPath);
      for (const file of srcFiles) {
        existingFiles.add(file);
      }

      // Watch manifest and package.json
      const manifestWatcher = chokidar.watch([manifestPath, userPkgPath], {
        persistent: true,
        ignoreInitial: false,
      });
      manifestWatcher.on('change', async () => {
        const { raw } = await _buildManifestFile(options, files);

        // Validate output files
        validateOutputFiles(options, files, 'manifest-changed');

        // Trigger server restart if not in build mode
        if (options.command !== 'build') {
          await RestartViteServerTask.run(options, context);
        }

        // Rebuild main if needed
        if (raw.main !== previousMainValue) {
          previousMainValue = raw.main;
          await BuildMainTask.run(options, context);
        }
      });

      // Watch src directory
      const srcWatcher = chokidar.watch([srcPath], {
        persistent: true,
        ignoreInitial: false,
      });

      srcWatcher.on('add', async (filePath) => {
        if (existingFiles.has(filePath)) return;
        existingFiles.add(filePath);

        const relativePath = relative(process.cwd(), filePath);
        const { raw } = await _buildManifestFile(options, files);

        if (relativePath === raw.ui) {
          if (options.command !== 'build') {
            await RestartViteServerTask.run(options, context);
          }
        }
        if (relativePath === raw.main) {
          await BuildMainTask.run(options, context);
        }

        validateOutputFiles(options, files, 'file-added');
      });

      // Register cleanup for watchers
      registerCleanup(async () => {
        await Promise.all([manifestWatcher.close(), srcWatcher.close()]);
      });
    } else if (options.command === 'build') {
      // Register a cleanup handler that will NOT delete the manifest file in build mode
      registerCleanup(async () => {
        log.debug('Skipping manifest cleanup in build mode');
      });
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to build manifest: ${errorMessage}`);
  }
};

export const BuildManifestTask = task('build:manifest', buildManifest);
export type BuildManifestTask = GetTaskTypeFor<typeof BuildManifestTask>;

export default BuildManifestTask;

/**
 * Builds and writes the manifest file to disk.
 * This function:
 * 1. Creates the output directory if it doesn't exist
 * 2. Applies default values (api version)
 * 3. Overrides main/ui paths with their output filenames
 * 4. Writes the processed manifest to disk
 *
 * @param options - Plugin build options
 * @param files - Files context from get-files task
 * @returns The raw and processed manifest contents
 */
async function _buildManifestFile(
  options: PluginOptions,
  files: GetFilesTaskResult['files'],
): Promise<BuildManifestResult> {
  const outputDirPath = resolve(process.cwd(), options.output || 'dist');
  const manifestPath = join(outputDirPath, 'manifest.json');

  log.debug(`Writing manifest to ${manifestPath}...`);

  // Ensure output directory exists
  await mkdir(outputDirPath, { recursive: true });

  // Define default and overridden values
  const defaultValues = {
    api: '1.0.0',
  };

  const overriddenValues: Partial<ManifestFile> = {};

  // Override main/ui paths with their output filenames
  if (files.manifest.main) {
    overriddenValues.main = 'main.js';
  }

  if (files.manifest.ui) {
    overriddenValues.ui = 'ui.html';
  }

  // Merge manifest values and filter out null/undefined
  const processed = filterNullProps({
    ...defaultValues,
    ...files.manifest,
    ...overriddenValues,
  });

  // Write manifest file
  await writeFile(manifestPath, JSON.stringify(processed, null, 2), 'utf-8');

  log.debug('Manifest file written successfully');

  return {
    raw: files.manifest,
    processed,
  };
}
