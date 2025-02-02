import type { Task, TaskOptions } from '#tasks';

/**
 * Mock task runner for testing
 */
export class MockTaskRunner {
  private tasks: Map<string, Task>;
  private taskResults: Map<string, unknown>;
  private taskErrors: Map<string, Error>;
  private taskExecutions: string[];
  private taskExecutionTimes: Map<string, number>;

  constructor() {
    this.tasks = new Map();
    this.taskResults = new Map();
    this.taskErrors = new Map();
    this.taskExecutions = [];
    this.taskExecutionTimes = new Map();
  }

  /**
   * Add a task to the runner
   */
  addTask(name: string, task: Task): void {
    this.tasks.set(name, task);
  }

  /**
   * Set a result for a task
   */
  setTaskResult(name: string, result: unknown): void {
    this.taskResults.set(name, result);
  }

  /**
   * Set an error for a task
   */
  setTaskError(name: string, error: Error): void {
    this.taskErrors.set(name, error);
  }

  /**
   * Set execution time for a task
   */
  setTaskExecutionTime(name: string, time: number): void {
    this.taskExecutionTimes.set(name, time);
  }

  /**
   * Clear all task data
   */
  clear(): void {
    this.tasks.clear();
    this.taskResults.clear();
    this.taskErrors.clear();
    this.taskExecutions = [];
    this.taskExecutionTimes.clear();
  }

  /**
   * Get task execution history
   */
  getTaskExecutions(): string[] {
    return [...this.taskExecutions];
  }

  /**
   * Run a task with the given options
   */
  async run(name: string, options: TaskOptions = {}): Promise<unknown> {
    this.taskExecutions.push(name);

    const task = this.tasks.get(name);
    if (!task) {
      throw new Error(`Task ${name} not found`);
    }

    const error = this.taskErrors.get(name);
    if (error) {
      throw error;
    }

    const executionTime = this.taskExecutionTimes.get(name) ?? 100;
    await new Promise((resolve) => setTimeout(resolve, executionTime));

    const result = this.taskResults.get(name);
    return result;
  }

  /**
   * Run tasks in series
   */
  serial(...tasks: Task[]): () => Promise<void> {
    return async () => {
      for (const task of tasks) {
        await task();
      }
    };
  }

  /**
   * Run tasks in parallel
   */
  parallel(...tasks: Task[]): () => Promise<void> {
    return async () => {
      await Promise.all(tasks.map((task) => task()));
    };
  }
}

/**
 * Mock task runner instance
 */
export const mockTaskRunner = new MockTaskRunner();
