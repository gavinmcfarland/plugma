import { vi } from 'vitest';
import { mockVite } from '../vite/mock-vite.js';

/**
 * Mock task runner for testing
 */
export const mockTaskRunner = {
  task: vi.fn((name, fn) => {
    console.log('INFO: Creating task:', name);
    return { name, run: fn };
  }),
  serial: vi.fn((...tasks) => {
    console.log(
      'INFO: Creating serial task runner with tasks:',
      tasks.map((t) => t.name),
    );
    return (options) => {
      console.log('INFO: Starting development server...');
      console.log('INFO: Executing tasks...');
      console.log(
        'INFO: Executing tasks:',
        tasks.map((t) => t.name),
      );

      // Execute build tasks
      const buildTasks = tasks.filter((task) => task.name.startsWith('build:'));
      if (buildTasks.length > 0) {
        console.log(
          'INFO: Executing build tasks:',
          buildTasks.map((t) => t.name),
        );
        console.log('INFO: Development server started successfully');
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
