import { TaskRunner, createHelpers } from "../core/task-runner/task-runner.js";

// Define your available tasks
export type AvailableTasks = "dev" | "build" | "test";

// Create a singleton instance of the TaskRunner with your specific task types
const taskRunner = new TaskRunner<AvailableTasks>();

// Create helpers with the same generic type
export const { log, task, run, serial, parallel } =
	createHelpers<AvailableTasks>(taskRunner);
