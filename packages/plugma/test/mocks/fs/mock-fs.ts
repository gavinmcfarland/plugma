/**
 * Test utilities for mocking the file system
 */

import type { Dirent } from 'node:fs';
import { dirname, join } from 'node:path';
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
  private directories: Set<string> = new Set();

  constructor(initialFiles: Record<string, string> = {}) {
    for (const [path, content] of Object.entries(initialFiles)) {
      this.writeFileSync(path, content);
    }
  }

  /**
   * Add files to the mock filesystem
   */
  addFiles(files: Record<string, string>): MockFs {
    for (const [path, content] of Object.entries(files)) {
      this.writeFileSync(path, content);
    }
    return this;
  }

  /**
   * Clear all files from the mock filesystem
   */
  clear(): void {
    this.files.clear();
    this.directories.clear();
  }

  /**
   * Check if a file exists in the mock filesystem
   */
  exists(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    return (
      this.files.has(normalizedPath) || this.directories.has(normalizedPath)
    );
  }

  /**
   * Check if a directory exists in the mock filesystem
   */
  existsDir(path: string): boolean {
    return this.directories.has(this.normalizePath(path));
  }

  /**
   * Normalize a file path
   */
  private normalizePath(path: string): string {
    // Remove leading ./ and multiple slashes
    const normalized = join(path)
      .replace(/^\.\//, '')
      .replace(/\/+/g, '/')
      .replace(/\\/g, '/');
    return normalized === '.' ? '' : normalized;
  }

  /**
   * Create parent directories for a file path
   */
  private createParentDirectories(path: string): void {
    const dir = dirname(path);
    if (dir === '.' || dir === '') return;

    const normalizedDir = this.normalizePath(dir);
    this.directories.add(normalizedDir);

    // Create parent directories recursively
    this.createParentDirectories(dir);
  }

  // Async methods
  async access(path: string): Promise<void> {
    const normalizedPath = this.normalizePath(path);
    if (!this.exists(normalizedPath)) {
      throw new Error('ENOENT: no such file or directory');
    }
    return Promise.resolve();
  }

  async readFile(path: string): Promise<string> {
    const normalizedPath = this.normalizePath(path);
    if (!this.files.has(normalizedPath)) {
      throw new Error('ENOENT: no such file or directory');
    }
    return Promise.resolve(this.files.get(normalizedPath)!);
  }

  async writeFile(path: string, content: string): Promise<void> {
    const normalizedPath = this.normalizePath(path);
    this.createParentDirectories(normalizedPath);
    this.files.set(normalizedPath, content);
    return Promise.resolve();
  }

  async rm(path: string, options?: { recursive?: boolean }): Promise<void> {
    const normalizedPath = this.normalizePath(path);
    if (!this.exists(normalizedPath)) {
      throw new Error('ENOENT: no such file or directory');
    }

    if (options?.recursive) {
      // Remove all files and directories under this path
      for (const filePath of this.files.keys()) {
        if (filePath.startsWith(normalizedPath)) {
          this.files.delete(filePath);
        }
      }
      for (const dirPath of this.directories) {
        if (dirPath.startsWith(normalizedPath)) {
          this.directories.delete(dirPath);
        }
      }
    } else {
      this.files.delete(normalizedPath);
      this.directories.delete(normalizedPath);
    }

    return Promise.resolve();
  }

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    const normalizedPath = this.normalizePath(path);
    if (options?.recursive) {
      this.createParentDirectories(normalizedPath);
    }
    this.directories.add(normalizedPath);
    return Promise.resolve();
  }

  // Sync methods
  readFileSync(path: string): string {
    const normalizedPath = this.normalizePath(path);
    if (!this.files.has(normalizedPath)) {
      throw new Error('ENOENT: no such file or directory');
    }
    return this.files.get(normalizedPath)!;
  }

  writeFileSync(path: string, content: string): void {
    const normalizedPath = this.normalizePath(path);
    this.createParentDirectories(normalizedPath);
    this.files.set(normalizedPath, content);
  }

  mkdirSync(path: string, options?: { recursive?: boolean }): void {
    const normalizedPath = this.normalizePath(path);
    if (options?.recursive) {
      this.createParentDirectories(normalizedPath);
    }
    this.directories.add(normalizedPath);
  }

  rmSync(path: string, options?: { recursive?: boolean }): void {
    const normalizedPath = this.normalizePath(path);
    if (!this.exists(normalizedPath)) {
      throw new Error('ENOENT: no such file or directory');
    }

    if (options?.recursive) {
      // Remove all files and directories under this path
      for (const filePath of this.files.keys()) {
        if (filePath.startsWith(normalizedPath)) {
          this.files.delete(filePath);
        }
      }
      for (const dirPath of this.directories) {
        if (dirPath.startsWith(normalizedPath)) {
          this.directories.delete(dirPath);
        }
      }
    } else {
      this.files.delete(normalizedPath);
      this.directories.delete(normalizedPath);
    }
  }
}

/**
 * Create a new mock filesystem instance
 */
export function createMockFs(
  initialFiles: Record<string, string> = {},
): MockFs {
  return new MockFs(initialFiles);
}

/**
 * Mock filesystem instance for testing
 */
export const mockFs = createMockFs();

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
