import { beforeEach, describe, expect, test } from "vitest";
import { TaskRunner } from "../../../src/core/task-runner/task-runner.js";
import type { RegisteredTask } from "../../../src/core/task-runner/types.js";

describe("Task Runner", () => {
	let taskRunner: TaskRunner<RegisteredTask<any, any, any, any>>;

	beforeEach(() => {
		taskRunner = new TaskRunner();
	});

	describe("Task Registration", () => {
		test("should register a task successfully", () => {
			const handler = async () => "test result";
			const task = taskRunner.task("test-task", handler);

			expect(task.name).toBe("test-task");
			expect(task.run).toBe(handler);
		});

		test("should throw error when registering duplicate task", () => {
			const handler = async () => "test result";
			taskRunner.task("test-task", handler);

			expect(() => taskRunner.task("test-task", handler)).toThrow(
				"already registered",
			);
		});
	});

	describe("Task Execution", () => {
		test("should execute tasks in sequence", async () => {
			const task1 = taskRunner.task(
				"task1",
				async (opt: {}, ctx: {}) => "result1",
			);
			const task2 = taskRunner.task(
				"task2",
				async (_: {}, context: { task1: string }) => {
					expect(context.task1).toBe("result1");
					return 42;
				},
			);

			const results = await taskRunner.serial(task1, {}, task2);
			expect(results.task1).toBe("result1");
			expect(results.task2).toBe(42);
		});

		test("should handle task execution errors", async () => {
			const task = taskRunner.task("error-task", async () => {
				throw new Error("Task execution failed");
			});

			await expect(taskRunner.serial(task, {})).rejects.toThrow(
				"Task execution failed",
			);
		});
	});

	describe("Task Results", () => {
		test("should get task result with proper typing", async () => {
			interface TaskResult {
				value: number;
			}
			const task = taskRunner.task("typed_task", async () => ({
				value: 42,
			}));

			const results = await taskRunner.serial(task, {});
			expect(results.typed_task.value).toBe(42);
		});

		test("should return undefined for missing task result", () => {
			const results = {} as Record<string, unknown>;
			const result = results["missing-task"];
			expect(result).toBeUndefined();
		});
	});
});
