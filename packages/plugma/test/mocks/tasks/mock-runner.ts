import { vi } from 'vitest';
import { mockVite } from '../vite/mock-vite.js';

/**
 * Mock task runner for testing
 */
export const mockTaskRunner = {
  task: vi.fn((name, fn) => {
    console.log('Creating task:', name);
    return { name, run: fn };
  }),
  serial: vi.fn((...tasks) => {
    console.log(
      'Creating serial task runner with tasks:',
      tasks.map((t) => t.name),
    );
    return (options) => {
      console.log('Running tasks with options:', options);
      console.log(
        'Executing tasks:',
        tasks.map((t) => t.name),
      );

      // Execute build tasks
      const buildTasks = tasks.filter((task) => task.name.startsWith('build:'));
      if (buildTasks.length > 0) {
        console.log(
          'Executing build tasks:',
          buildTasks.map((t) => t.name),
        );
        return mockVite.build();
      }
      return Promise.resolve(undefined);
    };
  }),
  parallel: vi.fn((...tasks) => {
    return (options) => {
      // Mock successful task execution without actually running tasks
      return new Promise((resolve) => setTimeout(resolve, 100));
    };
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
