// import { isNode } from './is-node.js';

// // Node.js specific imports (loaded only once)
// let nodeUrl: typeof import('node:url');
// let nodePath: typeof import('node:path');

// if (isNode()) {
//   (async () => {
// 		const imports = await Promise.all([
// 			import('node:url'),
// 			import('node:path')
// 		]);
// 		nodeUrl = imports[0];
// 		nodePath = imports[1];
// 	})()
// }

// /**
//  * Gets directory name from file URL (works in both Node.js and browser)
//  *
//  * @param url - import.meta.url from calling module
//  * @returns Directory path of the calling module
//  *
//  * @remarks
//  * - Node.js: Uses fileURLToPath and path.dirname
//  * - Browser: Parses URL pathname directly
//  */
// export function getDirName(url: string): string {
//   if (isNode()) {
//     return nodePath.dirname(nodeUrl.fileURLToPath(new URL(url)));
//   }

//   // Browser implementation
//   const urlObj = new URL(url);
//   const pathname = urlObj.pathname;
//   const lastSlashIndex = pathname.lastIndexOf('/');
//   return lastSlashIndex >= 0 ? pathname.slice(0, lastSlashIndex) : pathname;
// }

import { getDirname, getFilename } from 'cross-dirname';

export const getDirName: {
  /**
   * Gets the directory name from the provided URL.
   *
   * @param url - The URL from which to extract the directory name
   * @returns Directory path of the calling module
   * @deprecated Use getDirName() without parameters instead.
   */
  (url: string): string; // For URL input (deprecated)

  /**
   * Gets the directory name of the current module.
   *
   * @returns Directory path of the calling module
   */
  (): string; // No parameters
} = getDirname;

export const getFileName: {
  /**
   * Gets the file name from the provided URL.
   *
   * @param url - The URL from which to extract the file name
   * @returns File name of the calling module
   * @deprecated Use getFileName() without parameters instead.
   */
  (url: string): string; // For URL input (deprecated)

  /**
   * Gets the file name of the current module.
   *
   * @returns File name of the calling module
   */
  (): string; // No parameters
} = getFilename;
