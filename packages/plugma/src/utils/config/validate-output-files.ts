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

type ValidationEventType =
  | 'manifest-changed'
  | 'file-added'
  | 'plugin-built'
  | 'on-initialisation';

/**
 * Handles terminal scrolling and status message display.
 * Used to provide visual feedback about file system changes.
 */
async function displayStatusChange(
  message: string,
  type: ValidationEventType,
): Promise<void> {
  if (type === 'on-initialisation') return;

  console.log('\n'.repeat(process.stdout.rows - 2));
  process.stdout.write('\x1B[H');
  console.log(
    `${chalk.grey(formatTime())}${chalk.cyan(chalk.bold(' [plugma]'))}${chalk.green(
      ` ${message}`,
    )}`,
  );
}

/**
 * Safely removes a file or directory if it exists.
 * @returns true if the file was removed, false if it didn't exist
 */
async function safelyRemoveFile(filePath: string): Promise<boolean> {
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
}

/**
 * Validates the existence of a manifest entry's target file.
 * @returns true if the file exists, false otherwise
 */
async function validateManifestEntry(
  filePath: string | undefined,
  fieldName: string,
  files: UserFiles,
  type: ValidationEventType,
): Promise<boolean> {
  if (!filePath) return false;

  try {
    await access(resolve(filePath));
    return true;
  } catch {
    if (type !== 'plugin-built') {
      await displayStatusChange(
        type === 'manifest-changed' ? 'manifest changed' : 'file changed',
        type,
      );
    }

    console.error(
      `[plugma] Error: The file specified in the manifest's '${fieldName}' field could not be found at path: ${files.manifest[fieldName]}. Please ensure the file path is correct and that the file exists.`,
    );
    return false;
  }
}

/**
 * Validates and cleans up plugin output files based on manifest entries.
 * This is a refactored version of the original `cleanManifestFiles()` function from the JavaScript implementation.
 * It handles three main responsibilities:
 * 1. Validates the existence of files specified in the manifest
 * 2. Removes output files when their source files are missing
 * 3. Provides visual feedback about file system changes
 *
 * @param options - Plugin configuration options
 * @param files - User files configuration
 * @param type - Event that triggered the validation
 */
export async function cleanPluginOutputFiles(
  options: PluginOptions,
  files: UserFiles,
  type: ValidationEventType,
): Promise<void> {
  // Show initial status for non-build events
  if (type !== 'plugin-built') {
    await displayStatusChange(
      type === 'manifest-changed' ? 'manifest changed' : 'file changed',
      type,
    );
  }

  // Resolve paths based on manifest entries
  const mainFilePath =
    files.manifest.main && resolve(join(process.cwd(), files.manifest.main));
  const uiFilePath =
    files.manifest.ui && resolve(join(process.cwd(), files.manifest.ui));

  // Handle main entry
  if (files.manifest.main) {
    await validateManifestEntry(mainFilePath, 'main', files, type);
  } else {
    if (type !== 'plugin-built') {
      await displayStatusChange('manifest changed', type);
    }
    console.error(
      "[plugma] Error: The 'main' field is missing in the manifest. Please specify the 'main' entry point.",
    );
  }

  // Clean up main output if needed
  if (
    !files.manifest.main ||
    !(await validateManifestEntry(mainFilePath, 'main', files, type))
  ) {
    await safelyRemoveFile(
      resolve(join(process.cwd(), options.output, 'main.js')),
    );
  }

  // Handle UI entry
  if (files.manifest.ui) {
    await validateManifestEntry(uiFilePath, 'ui', files, type);
  }

  // Clean up UI output if needed
  if (
    !files.manifest.ui ||
    !(await validateManifestEntry(uiFilePath, 'ui', files, type))
  ) {
    await safelyRemoveFile(
      resolve(join(process.cwd(), options.output, 'ui.html')),
    );
  }
}

// Re-export with the old name for backward compatibility
export const validateOutputFiles = cleanPluginOutputFiles;
