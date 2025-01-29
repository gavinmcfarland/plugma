import type { RegisteredTask } from '#core/task-runner/types.js';
import { vi } from 'vitest';

const mockTask = vi.fn((name: string, fn: () => Promise<any>) => ({
  name,
  run: fn,
}));

const mockSerial = vi.fn(
  (...tasks: RegisteredTask<any, any, any, any>[]) =>
    async (options: any) => {
      const results = [];
      for (const task of tasks) {
        results.push(await task.run(options, {}));
      }
      return results;
    },
);

const mockParallel = vi.fn(
  (...tasks: RegisteredTask<any, any, any, any>[]) =>
    async (options: any) => {
      return Promise.all(tasks.map((task) => task.run(options, {})));
    },
);

const mockRun = vi.fn();
const mockLog = vi.fn();

// Export the mocks directly
export const task = mockTask;
export const serial = mockSerial;
export const parallel = mockParallel;
export const run = mockRun;
export const log = mockLog;

// Mock the task runner module
vi.mock('#tasks/runner.js', () => ({
  task: mockTask,
  serial: mockSerial,
  parallel: mockParallel,
  run: mockRun,
  log: mockLog,
}));
