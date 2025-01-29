import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Recursively removes a directory and its contents
 * @param {string} dirPath - Path to the directory to remove
 */
async function removeDirectory(dirPath) {
  if (
    await fs.access(dirPath).then(
      () => true,
      () => false,
    )
  ) {
    const files = await fs.readdir(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        // Recursively remove subdirectories
        await removeDirectory(filePath);
      } else {
        // Remove files
        await fs.unlink(filePath);
      }
    }
    await fs.rmdir(dirPath); // Remove the directory itself
  }
}

/**
 * Recursively copies a directory and its contents
 * @param {string} source - Source directory path
 * @param {string} destination - Destination directory path
 */
async function copyDirectory(source, destination) {
  await fs.mkdir(destination, { recursive: true });

  const files = await fs.readdir(source);

  for (const file of files) {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);
    const stat = await fs.stat(sourcePath);

    if (stat.isDirectory()) {
      // Recursively copy subdirectories
      await copyDirectory(sourcePath, destPath);
    } else {
      // Check if file is named 'index.html'
      if (file === 'index.html') {
        // Rename 'index.html' to 'ui.html' during copy
        await fs.copyFile(sourcePath, path.join(destination, 'ui.html'));
      } else {
        // Copy files other than 'index.html'
        await fs.copyFile(sourcePath, destPath);
      }
    }
  }

  // Remove all directories within the destination directory
  const subdirs = await fs.readdir(destination);
  for (const subdir of subdirs) {
    const subdirPath = path.join(destination, subdir);
    const stat = await fs.stat(subdirPath);
    if (stat.isDirectory()) {
      await removeDirectory(subdirPath);
    }
  }
}

/**
 * Vite plugin to copy a directory after build
 * @param {Object} options - Plugin options
 * @param {string} options.sourceDir - Source directory to copy from
 * @param {string} options.targetDir - Target directory to copy to
 * @returns {import('vite').Plugin} Vite plugin
 */
export default function viteCopyDirectoryPlugin({ sourceDir, targetDir }) {
  return {
    name: 'vite-plugin-copy-dir',
    apply: 'build',
    async writeBundle() {
      await copyDirectory(sourceDir, targetDir);
    },
  };
}
