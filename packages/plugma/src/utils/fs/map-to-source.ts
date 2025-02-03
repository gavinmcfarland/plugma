import { readFileSync } from 'node:fs';

import { type RawSourceMap, SourceMapConsumer } from 'source-map';

import { getDirName } from '#utils';

/** Tracks if source map preloading has completed */
let preloadCompleted = false;

const sourceMapCache = new Map<string, SourceMapConsumer>();

/**
 * Maps a position from a compiled file to its original source location using sourcemaps.
 * Handles paths in the format "/path/to/file.js:line:column" or just "/path/to/file.js".
 *
 * @param filePath - The full file path, optionally with line and column numbers
 * @returns The source file path starting with 'src/', or the original path if mapping fails
 */
export async function mapToSource(filePath: string): Promise<string> {
  // Extract path and line/column info
  const [rawPath, line, column] = filePath.split(':');
  if (!rawPath) return filePath;

  try {
    // Only attempt to map if it's a compiled file
    if (!rawPath.includes('/dist/')) {
      return filePath.replace(/^.*?src\//, 'src/');
    }

    const mapPath = `${rawPath}.map`;
    const rawMap = JSON.parse(readFileSync(mapPath, 'utf8')) as RawSourceMap;

    let result = filePath;
    try {
      // Await the consumer creation
      const consumer = await new SourceMapConsumer(rawMap);
      const pos = consumer.originalPositionFor({
        line: Number(line) || 1,
        column: Number(column) || 0,
      });

      if (pos.source) {
        // Extract the src/ part onwards
        const srcPath = pos.source.replace(/^.*?src\//, 'src/');
        result = pos.line ? `${srcPath}:${pos.line}` : srcPath;
      }

      consumer.destroy();
    } catch (error) {
      console.error('Error mapping source:', error);
    }

    return result;
  } catch (error) {
    // If anything fails, return the original path cleaned up
    const srcMatch = filePath.match(/src\/.+/);
    return srcMatch ? srcMatch[0] : filePath;
  }
}

/**
 * Synchronous source mapping with async fallback (debug mode only)
 * @warning Only for use in logging paths - blocks event loop during mapping
 */
export function mapToSourceSync(filePath: string): string {
  // Simple path cleanup for non-debug or non-dist files
  if (!process.env.PLUGMA_DEBUG || !filePath.includes('/dist/')) {
    return cleanSourcePath(filePath);
  }

  // Extract base path without line/column
  const [rawPath, line, column] = filePath.split(':');

  const consumer = sourceMapCache.get(rawPath);

  if (consumer) {
    const result = mapWithConsumer(
      consumer,
      Number(line || 1),
      Number(column || 0),
      filePath,
    );
    return result;
  }

  return cleanSourcePath(filePath);
}

/** Shared path cleanup logic */
function cleanSourcePath(path: string): string {
  return path.replace(/^.*?src\//, 'src/');
}

/** Shared mapping logic using a SourceMapConsumer */
function mapWithConsumer(
  consumer: SourceMapConsumer,
  line: number,
  column: number,
  originalPath: string,
): string {
  const pos = consumer.originalPositionFor({ line, column });
  return pos.source
    ? formatSourcePosition(pos.source, pos.line ?? undefined)
    : cleanSourcePath(originalPath);
}

/** Format the source file path with optional line number */
function formatSourcePosition(source: string, line?: number): string {
  const srcPath = source.replace(/^.*?src\//, 'src/');
  return line ? `${srcPath}:${line}` : srcPath;
}

/**
 * Preloads all source maps from the dist directory
 * Should be called once at startup when debug mode is enabled
 */
export async function preloadSourceMaps(): Promise<void> {
  const { readdirSync, readFileSync } = await import('node:fs');
  const { join } = await import('node:path');

  // Get package's own dist directory
  const packageDistPath = join(getDirName(import.meta.url), '../../');

  async function walkDir(dir: string): Promise<void> {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await walkDir(fullPath);
      } else if (entry.isFile() && fullPath.endsWith('.map')) {
        try {
          const rawMap = JSON.parse(
            readFileSync(fullPath, 'utf8'),
          ) as RawSourceMap;
          const consumer = await new SourceMapConsumer(rawMap);
          const sourcePath = fullPath.replace(/\.map$/, '');
          sourceMapCache.set(sourcePath, consumer);
        } catch (error) {
          console.error('Error preloading source map:', fullPath, error);
        }
      }
    }
  }

  try {
    await walkDir(packageDistPath);
    preloadCompleted = true;
    console.log('✔ Plugma source maps loaded');
  } catch (error) {
    console.error('Failed to preload source maps:', error);
  }
}
