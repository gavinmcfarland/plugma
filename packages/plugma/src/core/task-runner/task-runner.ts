import { Logger } from "#utils/log/logger.js";

export interface TaskContext {
	[key: string]: unknown;
}

export interface TaskOptions {
	[key: string]: unknown;
}

export interface TaskResult {
	[key: string]: unknown;
}

export type TaskHandler = (
	options?: TaskOptions,
	context?: TaskContext,
) => Promise<TaskResult | void>;

export interface RegisteredTask<TName extends string = string> {
	name: TName;
	run: TaskHandler;
}

// Define types for task management
export type TaskName = string;
export type TaskInput<T extends string = string> = RegisteredTask<T> | T;

export class TaskRunner<T extends string = string> {
	private tasks: Map<string, RegisteredTask>;
	private logger: Logger;

	constructor(options?: { debug: boolean }) {
		this.tasks = new Map();
		this.logger = new Logger({ debug: options?.debug ?? false });
	}

	private logTaskError(taskName: string, error: unknown, indent = 1): void {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		this.logger
			.format({ indent })
			.error(`Task "${taskName}" failed: ${errorMessage}`);
	}

	private logTaskSuccess(taskName: string, indent = 1): void {
		this.logger
			.format({ indent })
			.success(`Task "${taskName}" completed successfully`);
	}

	private validateTasks(taskNames: string[]): void {
		const missingTasks = taskNames.filter((name) => !this.tasks.has(name));
		if (missingTasks.length > 0) {
			const availableTasks = Array.from(this.tasks.keys()).join(", ");
			throw new Error(
				`Tasks not registered: ${missingTasks.join(", ")}. ` +
					`Available tasks: ${availableTasks}`,
			);
		}
	}

	/**
	 * Register a task with a name and handler function
	 */
	task<TName extends T>(name: TName, handler: TaskHandler): RegisteredTask {
		this.logger.debug(`Registering task: ${name}`);
		if (this.tasks.has(name)) {
			throw new Error(`Task "${name}" is already registered`);
		}

		const task = { name, run: handler };
		this.tasks.set(name, task);
		return task;
	}

	/**
	 * Run a single task by its name or task object, or execute an anonymous function
	 */
	async run(
		taskIdentifierOrFn:
			| RegisteredTask<T>
			| ((options: TaskOptions) => Promise<TaskResult>)
			| string,
		options: TaskOptions = {},
		context: TaskContext = {},
	): Promise<TaskResult> {
		// Handle anonymous function case
		if (typeof taskIdentifierOrFn === "function") {
			this.logger
				.format({ indent: 1 })
				.debug("Starting anonymous function");
			try {
				const result = await taskIdentifierOrFn(options);
				this.logger
					.format({ indent: 1 })
					.success("Anonymous function completed");
				return result;
			} catch (error) {
				this.logTaskError("anonymous", error);
				throw error;
			}
		}

		// Handle named task execution
		const taskName =
			typeof taskIdentifierOrFn === "string"
				? taskIdentifierOrFn
				: taskIdentifierOrFn.name;

		const task = this.tasks.get(taskName);
		if (!task) {
			throw new Error(`Task "${taskName}" not found`);
		}

		this.logger.format({ indent: 1 }).debug(`Starting task "${taskName}"`);

		try {
			const result = await task.run(options, context);
			this.logTaskSuccess(taskName);
			return { [taskName]: result };
		} catch (error) {
			this.logTaskError(taskName, error);
			throw error;
		}
	}

	/**
	 * Run multiple tasks in series with proper dependency validation
	 */
	async serial<T extends string>(
		tasks: TaskInput<T>[],
		options: TaskOptions = {},
	): Promise<TaskResult> {
		const taskNames = tasks.map((task) =>
			typeof task === "string" ? task : task.name,
		) as T[];

		if (taskNames.length === 0) {
			throw new Error("No tasks provided for serial execution");
		}

		this.validateTasks(taskNames);
		this.logger
			.format({ indent: 1 })
			.debug(`Starting task series: ${taskNames.join(", ")}`);

		const context: TaskContext = {};

		for (const taskName of taskNames) {
			const task = this.tasks.get(taskName);
			if (!task) continue; // Already validated

			this.logger
				.format({ indent: 2 })
				.debug(`Starting task: ${taskName}`);

			try {
				const result = await task.run(options, context);
				context[taskName] = result;
				this.logger
					.format({ indent: 2 })
					.debug(`Completed task: ${taskName}`);
			} catch (error) {
				this.logTaskError(taskName, error, 2);
				throw new Error(
					`Serial execution failed at "${taskName}": ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		}

		return context;
	}

	/**
	 * Run multiple tasks in parallel
	 */
	async parallel(
		tasks: TaskInput[],
		options: TaskOptions = {},
	): Promise<TaskResult> {
		const taskNames = tasks.map((task) =>
			typeof task === "string" ? task : task.name,
		);

		if (taskNames.length === 0) {
			throw new Error("No tasks provided for parallel execution");
		}

		this.validateTasks(taskNames);

		const promises = taskNames.map(async (taskName) => {
			const task = this.tasks.get(taskName);
			if (!task) return { name: taskName, result: null };

			const result = await task.run(options, {});
			return { name: taskName, result };
		});

		const results = await Promise.all(promises);
		return results.reduce((acc, { name, result }) => {
			acc[name] = result;
			return acc;
		}, {} as TaskResult);
	}
}

/**
 * Creates typed helper functions for working with a TaskRunner instance
 */
export function createHelpers<T extends string>(runner: TaskRunner<T>) {
	return {
		task: <TName extends T>(
			name: TName,
			handler: TaskHandler,
		): RegisteredTask => runner.task(name, handler),
		run: (fn: (options: TaskOptions) => Promise<TaskResult>) =>
			runner.run(fn, {}),
		serial: (tasks: RegisteredTask[], options?: TaskOptions) =>
			runner.serial(tasks, options),
		parallel: (tasks: TaskInput[], options?: TaskOptions) =>
			runner.parallel(tasks, options),
	};
}
