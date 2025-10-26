import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { vi } from 'vitest';
import { mockFs } from '../mocks/fs/mock-fs.js';
import { mockCleanup } from '../mocks/mock-cleanup.js';
import { mockWebSocket } from '../mocks/server/mock-websocket.js';
import { mockVite } from '../mocks/vite/mock-vite.js';

/**
 * Options for setting up a test environment
 */
export interface TestEnvironmentOptions {
  /** Files to create in the test environment */
  files?: Record<string, string>;
  /** Port to use for servers (default: random) */
  port?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom test directory (default: test/sandbox) */
  testDir?: string;
}

/**
 * Sets up a test environment with the specified files and configuration
 * Creates a temporary directory with the plugin files and mocks necessary services
 *
 * @param options - Test environment configuration
 * @returns Cleanup function to remove the test environment
 */
export async function setupTestEnvironment(
  options: TestEnvironmentOptions,
): Promise<() => Promise<void>> {
  const {
    files,
    port = Math.floor(Math.random() * 10000) + 3000,
    debug = false,
    testDir = 'test/sandbox',
  } = options;

  // Clear mock fs
  mockFs.clear();

  // Add template file
  await mockFs.writeFile(
    join(testDir, 'dist', 'apps', 'figma-bridge.html'),
    `
<!DOCTYPE html>
<html>
<head>
  <title>Figma Bridge</title>
</head>
<body>
  <div id="figma-bridge"></div>
  <!-- UI_CONTENT -->
</body>
</html>
  `,
  );

  // Add test files to mock fs
  for (const [path, content] of Object.entries(files || {})) {
    const fullPath = join(testDir, path);
    await mockFs.writeFile(fullPath, content);
  }

  // Mock fs functions
  const originalMkdir = mkdir;
  const originalWriteFile = writeFile;
  const originalRm = rm;
  const originalExistsSync = existsSync;
  const originalReadFile = readFile;

  // @ts-expect-error - Mocking global functions
  global.mkdir = mockFs.mkdir.bind(mockFs);
  // @ts-expect-error - Mocking global functions
  global.writeFile = mockFs.writeFile.bind(mockFs);
  // @ts-expect-error - Mocking global functions
  global.rm = mockFs.rm.bind(mockFs);
  // @ts-expect-error - Mocking global functions
  global.existsSync = (path: string) => mockFs.exists(path);
  // @ts-expect-error - Mocking global functions
  global.readFile = mockFs.readFile.bind(mockFs);

  // Mock Vite
  vi.mock('vite', () => mockVite);

  // Mock other services
  mockWebSocket.clearMessageHandlers();
  mockCleanup();

  // Mock process.cwd() to return test directory
  const originalCwd = process.cwd;
  process.cwd = vi.fn(() => testDir);

  return async () => {
    // Restore original functions
    // @ts-expect-error - Restoring global functions
    global.mkdir = originalMkdir;
    // @ts-expect-error - Restoring global functions
    global.writeFile = originalWriteFile;
    // @ts-expect-error - Restoring global functions
    global.rm = originalRm;
    // @ts-expect-error - Restoring global functions
    global.existsSync = originalExistsSync;
    // @ts-expect-error - Restoring global functions
    global.readFile = originalReadFile;

    // Restore process.cwd
    process.cwd = originalCwd;

    // Clear mock fs
    mockFs.clear();
  };
}

/**
 * Triggers a file change in the test environment
 *
 * @param filePath - Path to the file to change
 * @param content - New content for the file
 */
export async function triggerFileChange(
  filePath: string,
  content: string,
): Promise<void> {
  const fullPath = join(process.cwd(), filePath);
  const dir = fullPath.split('/').slice(0, -1).join('/');
  await mkdir(dir, { recursive: true });
  await writeFile(fullPath, content);
}

/**
 * Waits for a condition to be true
 *
 * @param condition - Condition to wait for
 * @param timeout - Maximum time to wait in milliseconds
 * @param interval - Time between checks in milliseconds
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100,
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}
