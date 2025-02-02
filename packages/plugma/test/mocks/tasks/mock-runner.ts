import { vi } from 'vitest';

/**
 * Mock task runner for testing
 */
export const mockTaskRunner = {
  task: vi.fn((name, fn) => ({ name, run: fn })),
  serial: vi.fn((...tasks) => {
    const runTasks = vi.fn(async () => {
      // Mock successful task execution without actually running tasks
      await new Promise((resolve) => setTimeout(resolve, 100));
      return undefined;
    });
    return runTasks;
  }),
  parallel: vi.fn((...tasks) => {
    const runTasks = vi.fn(async () => {
      // Mock successful task execution without actually running tasks
      await new Promise((resolve) => setTimeout(resolve, 100));
      return undefined;
    });
    return runTasks;
  }),
  run: vi.fn(async () => {
    // Mock successful task execution without actually running tasks
    await new Promise((resolve) => setTimeout(resolve, 100));
    return undefined;
  }),
  log: vi.fn(),
};

// Mock the task runner module
vi.mock('#tasks/runner.js', () => mockTaskRunner);
