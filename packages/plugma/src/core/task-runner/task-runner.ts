import { Logger } from "#utils/log/logger.js";

// Define a type for registered tasks
export type RegisteredTask = {
	name: string;
	run: (options: any, context: any) => Promise<any>;
};

// Define a type for task results
export type TaskResults = Record<string, any>;

// Create a type to track registered task names
export type RegisteredTaskNames<T> = T extends { name: infer N } ? N : never;

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
	task<TName extends T>(
		name: TName,
		handler: (options: any, context: any) => Promise<any>,
	): RegisteredTask {
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
			| T
			| RegisteredTask
			| ((options: any) => Promise<TaskResults>),
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
	async serial(
		tasks: (T | RegisteredTask)[],
		options: any = {},
	): Promise<TaskResults> {
		const taskNames = tasks.map((task) =>
			typeof task === "string" ? task : task.name,
		) as T[];

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
		tasks: (T | RegisteredTask)[],
		options: any = {},
	): Promise<TaskResults> {
		const taskNames = tasks.map((task) =>
			typeof task === "string" ? task : task.name,
		) as T[];

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
		task: runner.task.bind(runner),
		run: runner.run.bind(runner),
		serial: runner.serial.bind(runner),
		parallel: runner.parallel.bind(runner),
	};
}
