import { Logger } from "#utils/log/logger.js";

// Define a type for registered tasks
export type RegisteredTask<TName extends string = string> = {
	name: TName;
	run: (options: any, context: any) => Promise<any>;
};

// Define a type for task results
export type TaskResults = Record<string, any>;

// Modify how we track task names
export type TaskName = string;
export type RegisteredTasks<T extends string = string> = {
	[K in T]: true;
};

export type TaskInput<T extends string = string> = RegisteredTask<T> | T;

export class TaskRunner<T extends string = string> {
	private tasks: Map<T, RegisteredTask>;
	private logger: Logger;

	constructor(options?: { debug: boolean }) {
		this.tasks = new Map();
		this.logger = new Logger({ debug: options?.debug ?? false });
		this.logger.debug("TaskRunner initialized");
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
	task<TName extends string>(
		name: TName,
		handler: (options: any, context: any) => Promise<any>,
	): RegisteredTask<TName> {
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
			| RegisteredTask
			| ((options: any) => Promise<TaskResults>)
			| RegisteredTasks<T>,
		options?: any,
		context?: any,
	): Promise<TaskResults> {
		// Handle anonymous function case
		if (typeof taskIdentifierOrFn === "function") {
			this.logger
				.format({ indent: 1 })
				.debug("Starting anonymous function execution");
			console.time("Anonymous function");
			try {
				const result = await (
					taskIdentifierOrFn as (options: any) => Promise<TaskResults>
				)(options);
				console.timeEnd("Anonymous function");
				this.logger
					.format({ indent: 1 })
					.success("Anonymous function completed successfully");
				return result;
			} catch (error) {
				console.timeEnd("Anonymous function");
				this.logger
					.format({ indent: 1 })
					.error(
						`Anonymous function failed: ${error instanceof Error ? error.message : String(error)}`,
					);
				throw error;
			}
		}

		// Handle task execution case
		const taskName =
			typeof taskIdentifierOrFn === "string"
				? taskIdentifierOrFn
				: taskIdentifierOrFn.name;

		const registeredTask = this.tasks.get(taskName);
		if (!registeredTask) {
			throw new Error(`Task "${taskName}" not found`);
		}

		this.logger.format({ indent: 1 }).debug(`Starting task "${taskName}"`);
		console.time(`Task "${taskName}"`);

		try {
			const result = await registeredTask.run(options, context);
			console.timeEnd(`Task "${taskName}"`);
			this.logger
				.format({ indent: 1 })
				.success(`Task "${taskName}" completed successfully`);
			return { [taskName]: result };
		} catch (error) {
			console.timeEnd(`Task "${taskName}"`);
			this.logger
				.format({ indent: 1 })
				.error(
					`Task "${taskName}" failed: ${error instanceof Error ? error.message : String(error)}`,
				);
			throw error;
		}
	}

	/**
	 * Run multiple tasks in series with proper dependency validation
	 */
	async serial<T extends string>(
		tasks: TaskInput<T>[],
		options: any = {},
	): Promise<TaskResults> {
		const taskNames = tasks.map((task) =>
			typeof task === "string" ? task : task.name,
		);

		if (taskNames.length === 0) {
			throw new Error("No tasks provided to serial execution");
		}

		// Validate all tasks exist before starting
		const missingTasks = taskNames.filter((name) => !this.tasks.has(name));
		if (missingTasks.length > 0) {
			throw new Error(
				`The following tasks are not registered: ${missingTasks.join(", ")}. ` +
					`Available tasks are: ${Array.from(this.tasks.keys()).join(", ")}`,
			);
		}

		this.logger.format({ indent: 1 });
		this.logger.debug(
			`Starting execution of task series ${taskNames.join(", ")}`,
		);

		const context: TaskResults = {};

		for (const taskName of taskNames) {
			const registeredTask = this.tasks.get(taskName);
			if (!registeredTask) {
				throw new Error(`Task "${taskName}" not found`);
			}

			this.logger
				.format({ indent: 2 })
				.debug(`Starting task: ${taskName}`);

			try {
				const result = await registeredTask.run(options, context);
				context[taskName] = result;
				this.logger
					.format({ indent: 2 })
					.debug(`Completed task ${taskName}`);
			} catch (error) {
				this.logger
					.format({ indent: 2 })
					.error(`Task ${taskName} failed:`, error);
				throw new Error(
					`Serial execution failed at task "${taskName}": ${
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
	async parallel(
		tasks: (string | RegisteredTask)[],
		options: any = {},
	): Promise<TaskResults> {
		const taskNames = tasks.map((task) =>
			typeof task === "string" ? task : task.name,
		);

		if (taskNames.length === 0) {
			throw new Error("No tasks provided to parallel execution");
		}

		// Validate all tasks exist before starting
		const missingTasks = taskNames.filter((name) => !this.tasks.has(name));
		if (missingTasks.length > 0) {
			throw new Error(
				`The following tasks are not registered: ${missingTasks.join(", ")}. ` +
					`Available tasks are: ${Array.from(this.tasks.keys()).join(", ")}`,
			);
		}

		const promises = taskNames.map(async (taskName) => {
			const task = this.tasks.get(taskName);
			if (!task) {
				throw new Error(`Task "${taskName}" not found`);
			}
			const result = await task.run(options, {});
			return { name: taskName, result };
		});

		const results = await Promise.all(promises);
		return results.reduce((acc, { name, result }) => {
			acc[name] = result;
			return acc;
		}, {} as TaskResults);
	}
}

/**
 * Creates a set of helper functions for working with a TaskRunner instance.
 * These helpers are pre-typed with the available tasks, making them more convenient to use.
 */
export function createHelpers<T extends string>(runner: TaskRunner<T>) {
	return {
		log: runner.log.bind(runner),
		task: <TName extends string>(
			name: TName,
			handler: (options: any, context: any) => Promise<any>,
		): RegisteredTask<TName> => runner.task(name, handler),
		run: (fn: (options: any) => Promise<TaskResults>) => runner.run(fn, {}),
		serial: (tasks: RegisteredTask<T>[], options?: any) =>
			runner.serial(tasks, options),
		parallel: runner.parallel.bind(runner),
	};
}
