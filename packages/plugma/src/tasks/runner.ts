import { TaskRunner, createHelpers } from "../core/task-runner/task-runner.js";

// Create a singleton instance of the TaskRunner
const runner = new TaskRunner<string>({ debug: true });

// Create helpers
export const { log, task, run, serial, parallel } = createHelpers(runner);
