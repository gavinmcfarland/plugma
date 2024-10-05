export class Task {
	constructor(config = {}) {
		this.tasks = config.tasks || {};
		this.aliases = {};  // Store task aliases
		this.$ = {
			log: (message) => this.log(message),
		};
	}

	// Logger helper function
	log(message) {
		console.log(message);
	}

	// Register a task (supports generator and normal functions, with array for task names and aliases)
	task(taskNames, taskFn) {
		// If taskNames is a string, convert it to an array for consistency
		const namesArray = Array.isArray(taskNames) ? taskNames : [taskNames];
		const primaryTaskName = namesArray[0];  // The first element is the primary task name
		const aliasNames = namesArray.slice(1);  // Remaining elements are treated as aliases

		// Register the primary task
		if (typeof taskFn === 'function') {
			if (taskFn.constructor.name === 'GeneratorFunction') {
				// Store generator functions directly
				this.tasks[primaryTaskName] = taskFn;
			} else {
				// Wrap normal functions in a generator
				this.tasks[primaryTaskName] = function* (task, opts) {
					return taskFn(opts);  // Call the provided function and return its value
				};
			}
		} else {
			throw new Error('Task must be a function.');
		}

		// Register aliases if provided
		aliasNames.forEach(alias => {
			this.aliases[alias] = primaryTaskName;  // Map each alias to the primary task name
		});
	}

	// Run a single task by its name or alias or a callback function
	async run(taskNameOrCallback, opts = {}) {
		// Resolve task aliases
		const resolvedTaskName = this.aliases[taskNameOrCallback] || taskNameOrCallback;

		if (typeof resolvedTaskName === 'string') {
			// If it's a string, treat it as a task name and run that specific task
			if (!this.tasks[resolvedTaskName]) {
				throw new Error(`Task "${resolvedTaskName}" not found`);
			}
			const taskFn = this.tasks[resolvedTaskName];
			const iterator = taskFn(this, opts);
			let result = iterator.next();

			// Keep progressing through the generator until done
			while (!result.done) {
				result = iterator.next(result.value);  // Synchronous flow for generators
			}

			return result.value;  // Return the final result synchronously

		} else if (typeof taskNameOrCallback === 'function') {
			// If it's a function, execute the callback and forward the options
			await taskNameOrCallback(opts);  // Forward options to the callback here
		} else {
			throw new Error('Invalid argument: must be a task name (string) or callback (function).');
		}
	}

	// Run multiple tasks in serial and carry forward the updated `val`
	async serial(taskNames, opts = {}) {
		let lastVal = opts.val;  // Initialize with opts.val
		for (const name of taskNames) {
			lastVal = await this.run(name, { ...opts, val: lastVal });  // Forward options and updated value
		}
		return lastVal;
	}

	// Run multiple tasks in parallel
	async parallel(taskNames, opts = {}) {
		const promises = taskNames.map((name) => this.run(name, opts));  // Run tasks concurrently
		const results = await Promise.all(promises);  // Wait for all promises to resolve
		return results;
	}
}

// Updated main function to expose task, serial, and parallel methods
export function taskCaller(callback) {
	const taskRunner = new Task();

	// Create a wrapper around task registration to also expose serial and parallel methods
	function taskWrapper(taskNames, taskFn) {
		taskRunner.task(taskNames, taskFn);
	}

	// Expose serial and parallel as part of the task function
	taskWrapper.serial = taskRunner.serial.bind(taskRunner);
	taskWrapper.parallel = taskRunner.parallel.bind(taskRunner);

	// Pass task registration and run function to the callback
	callback(taskWrapper, taskRunner.run.bind(taskRunner));
}
