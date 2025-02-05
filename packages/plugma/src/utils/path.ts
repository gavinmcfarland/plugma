import { isNode } from './is-node';

// Node.js specific imports (loaded only once)
let nodeUrl: typeof import('node:url');
let nodePath: typeof import('node:path');

/**
 * Gets directory name from file URL (works in both Node.js and browser)
 *
 * @param url - import.meta.url from calling module
 * @returns Directory path of the calling module
 *
 * @remarks
 * - Node.js: Uses fileURLToPath and path.dirname
 * - Browser: Parses URL pathname directly
 */
export function getDirName(url: string): string {
  if (isNode()) {
    // Lazy load Node.js modules only when needed
    if (!nodeUrl || !nodePath) {
      nodeUrl = require('node:url');
      nodePath = require('node:path');
    }
    return nodePath.dirname(nodeUrl.fileURLToPath(new URL(url)));
  }

  // Browser implementation
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  const lastSlashIndex = pathname.lastIndexOf('/');
  return lastSlashIndex >= 0 ? pathname.slice(0, lastSlashIndex) : pathname;
}
