import fs from 'node:fs';
import path from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

/**
 * Options for gathering build outputs
 */
interface GatherOptions {
  /**
   * Source directory containing the build outputs, relative to project root
   * @default 'dist'
   */
  sourceDir?: string;

  /**
   * Target directory where outputs will be gathered, relative to project root
   * If not provided, files will stay in their original directory
   */
  outputDir?: string;

  /**
   * Custom naming function for the gathered files
   * @param filePath - The file path relative to sourceDir
   * @returns The desired output path relative to outputDir
   */
  getOutputPath?: (filePath: string) => string;

  /**
   * Filter function to determine which files to gather
   * @param filePath - The file path relative to sourceDir
   * @returns Whether to include the file
   */
  filter?: (filePath: string) => boolean;

  /**
   * Whether to remove the source directory after gathering
   * @default false
   */
  removeSourceDir?: boolean;
}

/**
 * Recursively deletes a directory and its contents
 * @internal
 */
const deleteDirectoryRecursively = (dirPath: string): void => {
  if (fs.existsSync(dirPath)) {
    console.log('Deleting directory:', dirPath);
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.statSync(curPath).isDirectory()) {
        deleteDirectoryRecursively(curPath);
      } else {
        console.log('Deleting file:', curPath);
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
};

/**
 * Recursively finds all files in a directory
 * @internal
 */
const findFiles = (dir: string, base = ''): string[] => {
  console.log('Finding files in directory:', dir);
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const relativePath = path.join(base, entry.name);
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      console.log('Found directory:', fullPath);
      files.push(...findFiles(fullPath, relativePath));
    } else {
      console.log('Found file:', fullPath);
      files.push(relativePath);
    }
  }

  return files;
};

/**
 * Creates a Vite plugin that gathers build outputs into a single directory.
 *
 * This plugin:
 * 1. Finds all files in the source directory
 * 2. Optionally filters them based on a predicate
 * 3. Copies them to the target directory with optional renaming
 * 4. Optionally removes the source directory
 *
 * @example
 * ```ts
 * // Basic usage - gather outputs to dist/apps/
 * gatherBuildOutputs('dist/apps')
 *
 * // Advanced usage with options
 * gatherBuildOutputs({
 *   sourceDir: 'build',           // Look for files in build/ instead of dist/
 *   outputDir: 'dist/apps',       // Gather files in dist/apps/
 *   getOutputFilename: (file) => `app-${path.basename(file)}`,
 *   filter: (file) => file.endsWith('.html'),  // Only gather HTML files
 *   removeSourceDir: true         // Remove source directory after gathering
 * })
 * ```
 *
 * @param options - Either the target directory string or an options object
 * @returns A Vite plugin
 */
export function gatherBuildOutputs(
  options: string | GatherOptions = {},
): Plugin {
  // Normalize options
  const normalizedOptions: GatherOptions =
    typeof options === 'string' ? { outputDir: options } : options;

  const {
    sourceDir = 'dist',
    outputDir,
    getOutputPath: getOutputFilename = (file) => file,
    filter = () => true,
    removeSourceDir = false,
  } = normalizedOptions;

  let config: ResolvedConfig;

  return {
    name: 'vite-plugin-gather-build-outputs',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
      console.log('Plugin config resolved:', {
        root: config.root,
        sourceDir,
        outputDir,
      });
    },

    closeBundle() {
      const sourcePath = path.resolve(config.root, sourceDir);
      const targetPath = outputDir
        ? path.resolve(config.root, outputDir)
        : sourcePath;

      console.log('Gathering build outputs:', {
        sourcePath,
        targetPath,
        removeSourceDir,
      });

      // Skip if source directory doesn't exist
      if (!fs.existsSync(sourcePath)) {
        console.warn(`Source directory ${sourcePath} does not exist!`);
        return;
      }

      // Create target directory if it doesn't exist
      if (outputDir && !fs.existsSync(targetPath)) {
        console.log('Creating target directory:', targetPath);
        fs.mkdirSync(targetPath, { recursive: true });
      }

      // Find and filter all files
      const files = findFiles(sourcePath).filter(filter);
      console.log('Found files:', files);

      // Copy files to target directory
      for (const file of files) {
        const sourceFilePath = path.join(sourcePath, file);
        const outputName = getOutputFilename(file);
        const targetFilePath = path.join(targetPath, outputName);

        console.log('Processing file:', {
          source: sourceFilePath,
          output: outputName,
          target: targetFilePath,
        });

        // Create target subdirectories if needed
        const targetDir = path.dirname(targetFilePath);
        if (!fs.existsSync(targetDir)) {
          console.log('Creating target subdirectory:', targetDir);
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // Copy the file
        fs.copyFileSync(sourceFilePath, targetFilePath);
        console.log('Copied file:', sourceFilePath, '->', targetFilePath);
      }

      // Remove source directory if requested
      if (removeSourceDir) {
        console.log('Removing source directory:', sourcePath);
        deleteDirectoryRecursively(sourcePath);
      }
    },
  };
}

export default gatherBuildOutputs;
