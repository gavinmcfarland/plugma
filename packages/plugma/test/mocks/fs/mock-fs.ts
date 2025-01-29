/**
 * Test utilities for mocking the file system
 */

import type { Dirent } from 'node:fs';
import { vi } from 'vitest';

/**
 * Creates a mock directory entry
 * @param name - Name of the entry
 * @param isDirectory - Whether the entry is a directory
 * @returns A mock directory entry
 */
export function createMockDirent(name: string, isDirectory = false): Dirent {
  return {
    name,
    isFile: () => !isDirectory,
    isDirectory: () => isDirectory,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => false,
    isFIFO: () => false,
    isSocket: () => false,
  } as Dirent;
}

/**
 * A mock implementation of the Node.js file system
 */
export class MockFs {
  private files: Map<string, string> = new Map();

  constructor(initialFiles: Record<string, string> = {}) {
    for (const [path, content] of Object.entries(initialFiles)) {
      this.files.set(path, content);
    }
  }

  /**
   * Add files to the mock filesystem
   */
  addFiles(files: Record<string, string>): MockFs {
    for (const [path, content] of Object.entries(files)) {
      this.files.set(path, content);
    }
    return this;
  }

  /**
   * Clear all files from the mock filesystem
   */
  clear(): void {
    this.files.clear();
  }

  /**
   * Check if a file exists in the mock filesystem
   */
  exists(path: string): boolean {
    return this.files.has(path);
  }

  // Async methods
  async access(path: string): Promise<void> {
    if (!this.exists(path)) {
      throw new Error('ENOENT: no such file or directory');
    }
    return Promise.resolve();
  }

  async readFile(path: string): Promise<string> {
    if (!this.exists(path)) {
      throw new Error('ENOENT: no such file or directory');
    }
    return Promise.resolve(this.files.get(path)!);
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
    return Promise.resolve();
  }

  async rm(path: string): Promise<void> {
    if (!this.exists(path)) {
      throw new Error('ENOENT: no such file or directory');
    }
    this.files.delete(path);
    return Promise.resolve();
  }

  async mkdir(): Promise<void> {
    return Promise.resolve();
  }

  // Sync methods
  readFileSync(path: string): string {
    if (!this.exists(path)) {
      throw new Error('ENOENT: no such file or directory');
    }
    return this.files.get(path)!;
  }

  writeFileSync(path: string, content: string): void {
    this.files.set(path, content);
  }

  rmSync(path: string): void {
    if (!this.exists(path)) {
      throw new Error('ENOENT: no such file or directory');
    }
    this.files.delete(path);
  }

  mkdirSync(): void {
    // No-op in mock
  }
}

/**
 * Create a mock fs instance with initial files
 */
export function createMockFs(
  initialFiles: Record<string, string> = {},
): MockFs {
  return new MockFs(initialFiles);
}

// Vitest mock functions
export const mockAccess = vi
  .fn()
  .mockImplementation(async () => Promise.resolve());
export const mockReadFile = vi
  .fn()
  .mockImplementation(async (path: string) => Promise.resolve(''));
export const mockWriteFile = vi
  .fn()
  .mockImplementation(async () => Promise.resolve());
export const mockRm = vi.fn().mockImplementation(async () => Promise.resolve());
export const mockMkdir = vi
  .fn()
  .mockImplementation(async () => Promise.resolve());
export const mockReadFileSync = vi.fn().mockReturnValue('');
export const mockWriteFileSync = vi.fn();
export const mockRmSync = vi.fn();
export const mockMkdirSync = vi.fn();

/**
 * Creates a mock file system with common plugin files
 * @returns Mock fs functions and initial structure
 */
export function createMockPluginFs() {
  return createMockFs().addFiles({
    'package.json': JSON.stringify({
      name: 'test-plugin',
      version: '1.0.0',
      main: 'src/main.ts',
      ui: 'src/ui.tsx',
    }),
    'src/main.ts': 'export default function() {}',
    'src/ui.tsx': 'export default function UI() { return null; }',
    'manifest.json': JSON.stringify({
      name: 'Test Plugin',
      id: 'test-plugin',
      api: '1.0.0',
      main: 'dist/main.js',
      ui: 'dist/ui.html',
    }),
  });
}

/**
 * Creates a mock file system with build artifacts
 * @returns Mock fs functions and initial structure
 */
export function createMockBuildFs() {
  return createMockFs().addFiles({
    'dist/main.js': 'console.log("main")',
    'dist/ui.html': '<html><body>UI</body></html>',
    'dist/manifest.json': JSON.stringify({
      name: 'Test Plugin',
      id: 'test-plugin',
      api: '1.0.0',
      main: 'dist/main.js',
      ui: 'dist/ui.html',
    }),
  });
}
