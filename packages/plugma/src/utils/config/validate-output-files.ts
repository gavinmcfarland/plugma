/**
 * Validates output files against source files and manifest entries.
 * Removes output files that are invalid or stale.
 * @param options - Plugin configuration options
 * @param files - User files
 * @param type - Event that triggered the validation
 *
 * Tracking:
 * - [x] Add file validation
 *   - Verified validation features:
 *   - Main file existence check
 *   - UI file existence check
 *   - Path resolution
 *   - Proper error messages
 * - [x] Implement cleanup
 *   - Verified cleanup features:
 *   - File removal for missing entries
 *   - Directory handling
 *   - Safe file operations
 * - [x] Add status logging
 *   - Verified logging features:
 *   - Change type messages
 *   - Error reporting
 *   - Terminal scrolling
 * - [x] Handle events
 *   - Verified event handling:
 *   - Manifest changes
 *   - File additions
 *   - Plugin builds
 *   - Initialization
 */

import type { PluginOptions, UserFiles } from '#core/types.js';
import chalk from 'chalk';
import { access, lstat, rm, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { formatTime } from '../time.js';

/**
 * Validates output files against source files and manifest entries.
 * Removes output files that are invalid or stale.
 * @param options - Plugin configuration options
 * @param files - User files
 * @param type - Event that triggered the validation
 */
export async function validateOutputFiles(
  options: PluginOptions,
  files: UserFiles,
  type:
    | 'manifest-changed'
    | 'file-added'
    | 'plugin-built'
    | 'on-initialisation',
): Promise<void> {
  let scrollOnce = false;

  // Helper to log status change messages only once
  const logStatusChange = (message: string) => {
    if (!scrollOnce && type !== 'on-initialisation') {
      console.log('\n'.repeat(process.stdout.rows - 2));
      process.stdout.write('\x1B[H');
      console.log(
        `${chalk.grey(formatTime())}${chalk.cyan(chalk.bold(' [plugma]'))}${chalk.green(
          ` ${message}`,
        )}`,
      );
      scrollOnce = true;
    }
  };

  if (type !== 'plugin-built') {
    logStatusChange(
      type === 'manifest-changed' ? 'manifest changed' : 'file changed',
    );
  }

  // Helper to remove file if it exists
  const removeFileIfExists = async (filePath: string) => {
    try {
      await access(filePath);
      const stats = await lstat(filePath);
      if (stats.isDirectory()) {
        await rm(filePath, { recursive: true, force: true });
      } else {
        await unlink(filePath);
      }
      return true;
    } catch {
      return false;
    }
  };

  // Helper to check file existence and log errors
  const validateFile = async (
    filePath: string | undefined,
    fieldName: string,
  ) => {
    if (!filePath) return false;
    try {
      await access(resolve(filePath));
      return true;
    } catch {
      if (type !== 'plugin-built') {
        logStatusChange(
          type === 'manifest-changed' ? 'manifest changed' : 'file changed',
        );
      }
      console.error(
        `[plugma] Error: The file specified in the manifest's '${fieldName}' field could not be found at path: ${files.manifest[fieldName]}. Please ensure the file path is correct and that the file exists.`,
      );
      return false;
    }
  };

  // Resolve paths based on manifest entries
  const mainFilePath =
    files.manifest.main && resolve(join(process.cwd(), files.manifest.main));
  const uiFilePath =
    files.manifest.ui && resolve(join(process.cwd(), files.manifest.ui));

  // Validate 'main' entry
  if (files.manifest.main) {
    await validateFile(mainFilePath, 'main');
  } else {
    if (type !== 'plugin-built') {
      logStatusChange('manifest changed');
    }
    console.error(
      "[plugma] Error: The 'main' field is missing in the manifest. Please specify the 'main' entry point.",
    );
  }

  // Remove 'main.js' if 'main' entry is missing or file not found
  if (!files.manifest.main || !(await validateFile(mainFilePath, 'main'))) {
    await removeFileIfExists(
      resolve(join(process.cwd(), options.output, 'main.js')),
    );
  }

  // Validate 'ui' entry
  if (files.manifest.ui) {
    await validateFile(uiFilePath, 'ui');
  }

  // Remove 'ui.html' if 'ui' entry is missing or file not found
  if (!files.manifest.ui || !(await validateFile(uiFilePath, 'ui'))) {
    await removeFileIfExists(
      resolve(join(process.cwd(), options.output, 'ui.html')),
    );
  }
}
