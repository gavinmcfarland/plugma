import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Recursively gets all files in a directory and its subdirectories
 * @param directory - Root directory to scan
 * @returns Promise resolving to array of file paths
 */
export async function getFilesRecursively(
  directory: string,
): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFilesRecursively(entryPath)));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
  return files;
}
