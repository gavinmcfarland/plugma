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
    console.log('Clearing mock filesystem');
    this.files.clear();
    this.directories.clear();
  }

  /**
   * Check if a file exists in the mock filesystem
   */
  exists(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    const exists =
      this.files.has(normalizedPath) || this.directories.has(normalizedPath);
    // console.log(`Checking if ${normalizedPath} exists:`, exists);
    // console.log('Files:', Array.from(this.files.keys()));
    // console.log('Directories:', Array.from(this.directories));
    return exists;
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
    if (!path || path === '.' || path === '/') {
      return '';
    }

    // Remove leading ./ and multiple slashes
    return path
      .replace(/^\.\//, '')
      .replace(/\/+/g, '/')
      .replace(/\\/g, '/')
      .replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Create parent directories for a file path
   */
  private createParentDirectories(path: string): void {
    const normalizedPath = this.normalizePath(path);
    if (!normalizedPath) return;

    const parts = normalizedPath.split('/');
    let currentPath = '';

    // Create each directory in the path
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      if (currentPath) {
        this.directories.add(currentPath);
      }
    }
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
    console.log('Writing file:', path, content);
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
 * Mock filesystem instance for testing
 */
export const mockFs = createMockFs();

/**
 * Create a new mock filesystem instance
 * @deprecated Use the shared mockFs instance instead
 */
export function createMockFs(
  initialFiles: Record<string, string> = {},
): MockFs {
  const fs = new MockFs(initialFiles);
  return fs;
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
