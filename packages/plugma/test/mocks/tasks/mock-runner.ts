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
    const runTasks = vi.fn(async (options) => {
      console.log('Starting development server...');
      console.log('Executing tasks...');
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
        await mockVite.build();
      }
      console.log('Development server started successfully');
      return undefined;
    });
    return runTasks;
  }),
  parallel: vi.fn((...tasks) => {
    const runTasks = vi.fn(async (options) => {
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
