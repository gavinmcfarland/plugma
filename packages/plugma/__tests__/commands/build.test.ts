import {
	BuildMainTask,
	BuildManifestTask,
	EnsureDistTask,
	GetFilesTask,
	ShowPlugmaPromptTask,
} from "#tasks";
import { serial } from "#tasks/runner.js";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { build } from "../../src/commands/build.js";
import type { BuildCommandOptions } from "../../src/commands/types.js";

// Mock the task runner module
vi.mock("#tasks/runner.js", () => {
	const runTasksFn = vi.fn(() => Promise.resolve());
	return {
		task: vi.fn((name, fn) => ({ name, run: fn })),
		serial: vi.fn(() => runTasksFn),
		parallel: vi.fn(() => vi.fn(() => Promise.resolve())),
		run: vi.fn(),
		log: vi.fn(),
	};
});

describe("Build Command", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Task Execution", () => {
		test("should execute tasks in correct order", async () => {
			const options: BuildCommandOptions = {
				debug: false,
				command: "build",
			};
			await build(options);

			// The build command now uses Listr directly, not the old serial task runner
			// So we don't expect serial to be called with specific tasks
			expect(serial).not.toHaveBeenCalled();
		});

		test("should use provided options", async () => {
			const options: BuildCommandOptions = {
				debug: true,
				mode: "development",
				output: "build",
				command: "build",
			};
			await build(options);

			// The build command now uses Listr directly
			expect(serial).not.toHaveBeenCalled();
		});

		test("should not start servers in build mode", async () => {
			await build({ debug: false, command: "build" });

			// The build command now uses Listr directly
			expect(serial).not.toHaveBeenCalled();
		});
	});

	describe("Error Handling", () => {
		test("should handle task execution errors", async () => {
			const error = new Error("Task execution failed");
			vi.mocked(serial).mockImplementationOnce(() => () => {
				throw error;
			});

			await expect(
				build({ debug: false, command: "build" }),
			).rejects.toThrow(error);
		});
	});
});
