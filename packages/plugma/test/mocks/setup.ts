import { vi } from 'vitest';
import type { MockFs } from './fs/mock-fs.js';

/**
 * Sets up file system mocks
 */
export function setupFsMocks(mockFs: MockFs): void {
  vi.mock('node:fs/promises', () => ({
    readFile: mockFs.readFile.bind(mockFs),
    writeFile: mockFs.writeFile.bind(mockFs),
    mkdir: mockFs.mkdir.bind(mockFs),
    rm: mockFs.rm.bind(mockFs),
  }));

  vi.mock('node:fs', () => ({
    existsSync: (path: string) => mockFs.exists(path),
    readFileSync: mockFs.readFileSync.bind(mockFs),
    writeFileSync: mockFs.writeFileSync.bind(mockFs),
    mkdirSync: mockFs.mkdirSync.bind(mockFs),
    rmSync: mockFs.rmSync.bind(mockFs),
  }));
}

/**
 * Sets up all mocks for testing
 */
export function setupAllMocks(mockFs: MockFs): void {
  setupFsMocks(mockFs);
  vi.mock('#tasks/runner.js', () => {
    const runTasksFn = vi.fn(() => Promise.resolve());
    return {
      task: vi.fn((name, fn) => ({ name, run: fn })),
      serial: vi.fn(() => runTasksFn),
      parallel: vi.fn(() => vi.fn(() => Promise.resolve())),
      run: vi.fn(),
      log: vi.fn(),
    };
  });
}
