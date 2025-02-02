import { vi } from 'vitest';

// Mock fs modules
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  rm: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  rmSync: vi.fn(),
}));

// Mock task runner
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
