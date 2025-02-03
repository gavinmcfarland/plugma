import { Logger } from '#utils/log/logger.js';
import type { RegisteredTask, ResultsOfTask } from './types.js';

/**
 * TaskRunner class for managing and executing tasks in a type-safe manner.
 * This class provides functionality to register, run, and manage tasks with proper dependency validation.
 */
export class TaskRunner<
  AvailableTasks extends RegisteredTask<string, object, any, object> = never,
> {
  private tasks: Map<
    AvailableTasks['name'],
    RegisteredTask<string, any, any, any>
  >;
  private logger: Logger;

  constructor(options?: { debug: boolean }) {
    this.tasks = new Map();
    this.logger = new Logger({ debug: options?.debug ?? false });
    this.logger.debug('TaskRunner initialized');
  }

  /**
   * Log a message to the console
   */
  log(message: string): void {
    this.logger.debug(message);
  }

  /**
   * Register a task with a name and handler function
   */
  task<TName extends string, TOptions, TResults, TContext>(
    name: TName,
    handler: (options: TOptions, context: TContext) => Promise<TResults>,
  ): RegisteredTask<TName, TOptions, TResults, TContext> {
    this.logger.debug(`Registering task: ${name}`);
    if (this.tasks.has(name)) {
      throw new Error(`Task "${name}" is already registered`);
    }

    const task = {
      name,
      run: handler,
    };

    this.tasks.set(name, task);
    return task;
  }

  /**
   * Run a single task by its name
   */
  async run<
    T extends RegisteredTask<any, any, any, any> & {
      name: AvailableTasks['name'];
    },
  >(
    task: T,
    options: Parameters<T['run']>[0],
    context: Parameters<T['run']>[1],
  ): Promise<ReturnType<T['run']>> {
    const registeredTask = this.tasks.get(task.name);
    if (!registeredTask) {
      throw new Error(`Task "${task.name}" not found`);
    }

    this.logger.format({ indent: 1 }).debug(`Starting task "${task.name}"`);
    this.logger
      .format({ indent: 2 })
      .debug(`Options: ${JSON.stringify(options)}`);
    this.logger
      .format({ indent: 2 })
      .debug(`Context: ${JSON.stringify(context)}`);
    console.time(`Task "${task.name}"`);

    try {
      const result = (await registeredTask.run(options, context)) as ReturnType<
        T['run']
      >;
      console.timeEnd(`Task "${task.name}"`);
      this.logger
        .format({ indent: 1 })
        .success(`Task "${task.name}" completed successfully`);
      this.logger
        .format({ indent: 2 })
        .debug(`Result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      console.timeEnd(`Task "${task.name}"`);
      this.logger
        .format({ indent: 1 })
        .error(
          `Task "${task.name}" failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      throw error;
    }
  }

  /**
   * Run multiple tasks in series with proper dependency validation and guaranteed serial execution
   */
  async serial<First extends AvailableTasks, Rest extends AvailableTasks[]>(
    firstTask: First,
    options: Parameters<First['run']>[0],
    ...otherTasks: Rest
  ): Promise<ResultsOfTask<First | Rest[number]>> {
    this.logger.format({ indent: 1 });
    this.logger.debug(
      `Starting execution of task series ${firstTask.name}, ${otherTasks
        .map((task) => task.name)
        .join(', ')}`,
    );

    const context = {} as ResultsOfTask<First | Rest[number]>;
    const tasks = [firstTask, ...otherTasks] as ((First | Rest[number]) & {
      name: keyof typeof context;
    })[];

    // Use for...of to ensure sequential execution
    for (const task of tasks) {
      const registeredTask = this.tasks.get(task.name);
      if (!registeredTask) {
        throw new Error(`Task "${task.name}" not found`);
      }

      this.logger.format({ indent: 2 }).debug(`Starting task: ${task.name}`);

      try {
        // Await each task explicitly to ensure serial execution
        const result = await registeredTask.run(options, context);

        // Store result in context before proceeding to next task
        context[task.name] = result;

        this.logger
          .format({ indent: 2 })
          .debug(`Completed task ${task.name} with result:`, result);
      } catch (error) {
        this.logger
          .format({ indent: 2 })
          .error(`Task ${task.name} failed:`, error);

        // Rethrow with enhanced context
        throw new Error(
          `Serial execution failed at task "${task.name}": ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return context;
  }

  /**
   * Run multiple tasks in parallel
   */
  async parallel<T extends AvailableTasks>(
    tasks: T['name'][],
    options: Parameters<T['run']>[0],
  ): Promise<Record<T['name'], unknown>> {
    const promises = tasks.map(async (taskName) => {
      const task = this.tasks.get(taskName);
      if (!task) {
        throw new Error(`Task "${taskName}" not found`);
      }
      const context = {} as Record<T['name'], unknown>;
      const result = await task.run(options, context);
      return { name: taskName, result };
    });

    const results = await Promise.all(promises);
    const context = {} as Record<T['name'], unknown>;

    for (const { name, result } of results) {
      context[name] = result;
    }

    return context;
  }
}

/**
 * Creates a set of helper functions for working with a TaskRunner instance.
 * These helpers are pre-typed with the available tasks, making them more convenient to use.
 */
export function createHelpers<
  AvailableTasks extends RegisteredTask<any, any, any, any>,
>(runner: TaskRunner<AvailableTasks>) {
  return {
    log: (message: string) => runner.log(message),

    task: <TName extends string, TOptions, TResults, TContext>(
      name: TName,
      handler: (options: TOptions, context: TContext) => Promise<TResults>,
    ) => runner.task<TName, TOptions, TResults, TContext>(name, handler),

    run: <Task extends AvailableTasks>(
      task: Task,
      options: Parameters<Task['run']>[0],
      context: Parameters<Task['run']>[1],
    ) => runner.run<Task>(task, options, context),

    serial:
      <First extends AvailableTasks, Rest extends AvailableTasks[]>(
        firstTask: First,
        ...otherTasks: Rest
      ) =>
      (options: Parameters<First['run']>[0]) =>
        runner.serial(firstTask, options, ...otherTasks),

    parallel: (
      tasks: AvailableTasks['name'][],
      options: Parameters<AvailableTasks['run']>[0],
    ) => runner.parallel<AvailableTasks>(tasks, options),
  };
}
