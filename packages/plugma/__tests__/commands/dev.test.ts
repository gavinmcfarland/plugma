import { beforeEach, describe, expect, test, vi } from "vitest";
import { dev } from "../../src/commands/dev.js";

// Mock Listr2 instead of old task runner
const mockListrRun = vi.fn().mockResolvedValue({});
const mockListr = vi.fn().mockImplementation(() => ({
	run: mockListrRun,
}));

vi.mock("listr2", () => ({
	Listr: mockListr,
	ListrLogLevels: {
		FAILED: 'FAILED',
		OUTPUT: 'OUTPUT',
	},
}));

// Mock process.exit to prevent test termination
const mockProcessExit = vi.fn();
vi.mock("process", () => ({
	exit: mockProcessExit,
}));

// Mock the task factory functions used in dev command
const mockCreateBuildManifestTask = vi.fn().mockReturnValue({
	title: 'Build Manifest',
	task: vi.fn(),
});

const mockCreateBuildMainTask = vi.fn().mockReturnValue({
	title: 'Build Main',
	task: vi.fn(),
});

const mockCreateWrapPluginUiTask = vi.fn().mockReturnValue({
	title: 'Wrap Plugin UI',
	task: vi.fn(),
});

const mockCreateStartWebSocketsServerTask = vi.fn().mockReturnValue({
	title: 'Start WebSocket Server',
	task: vi.fn(),
});

const mockCreateStartViteServerTask = vi.fn().mockReturnValue({
	title: 'Start Vite Server',
	task: vi.fn(),
});

vi.mock("../../src/tasks/build-manifest.js", () => ({
	createBuildManifestTask: mockCreateBuildManifestTask,
}));

vi.mock("../../src/tasks/build-main.js", () => ({
	createBuildMainTask: mockCreateBuildMainTask,
}));

vi.mock("../../src/tasks/wrap-plugin-ui.js", () => ({
	createWrapPluginUiTask: mockCreateWrapPluginUiTask,
}));

vi.mock("../../src/tasks/start-websocket-server.js", () => ({
	createStartWebSocketsServerTask: mockCreateStartWebSocketsServerTask,
}));

vi.mock("../../src/tasks/start-dev-server.js", () => ({
	createStartViteServerTask: mockCreateStartViteServerTask,
}));

// Mock other dependencies
vi.mock("../../src/utils/debug-aware-logger.js", () => ({
	createDebugAwareLogger: vi.fn().mockReturnValue({
		log: vi.fn(),
	}),
}));

vi.mock("../../src/utils/save-plugma-cli-options.js", () => ({
	setConfig: vi.fn(),
}));

vi.mock("../../src/constants.js", () => ({
	DEFAULT_RENDERER_OPTIONS: {},
	SILENT_RENDERER_OPTIONS: {},
}));

vi.mock("chalk", () => ({
	default: {
		green: vi.fn((text) => text),
	},
}));

describe("Dev Command", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Task Execution", () => {
		test("should execute tasks in correct order with default options", async () => {
			const options = {
				debug: false,
				command: "dev" as const,
				mode: "development" as const,
				output: "dist",
				instanceId: "test",
				cwd: process.cwd(),
				port: 3000,
			};

			await dev(options);

			// Verify Listr was created with correct tasks in order
			expect(mockListr).toHaveBeenCalledWith(
				[
					expect.objectContaining({ title: 'Build Manifest' }),
					expect.objectContaining({ title: 'Build Main' }),
					expect.objectContaining({ title: 'Wrap Plugin UI' }),
					expect.objectContaining({ title: 'Start WebSocket Server' }),
					expect.objectContaining({ title: 'Start Vite Server' }),
				],
				expect.any(Object)
			);

			// Verify all task factories were called with options
			expect(mockCreateBuildManifestTask).toHaveBeenCalledWith(options);
			expect(mockCreateBuildMainTask).toHaveBeenCalledWith(options);
			expect(mockCreateWrapPluginUiTask).toHaveBeenCalledWith(options);
			expect(mockCreateStartWebSocketsServerTask).toHaveBeenCalledWith(options);
			expect(mockCreateStartViteServerTask).toHaveBeenCalledWith(options);

			// Verify Listr.run was called
			expect(mockListrRun).toHaveBeenCalled();

			// Dev command should not exit (it runs continuously)
			expect(mockProcessExit).not.toHaveBeenCalled();
		});

		test("should use provided options over defaults", async () => {
			const options = {
				debug: true,
				mode: "production" as const,
				output: "build",
				command: "dev" as const,
				instanceId: "custom-test",
				cwd: "/custom/path",
				port: 5000,
				websockets: true,
			};

			await dev(options);

			// Verify debug mode affects renderer options
			expect(mockListr).toHaveBeenCalledWith(
				expect.any(Array),
				expect.any(Object)
			);

			// Verify task factories received custom options
			expect(mockCreateBuildManifestTask).toHaveBeenCalledWith(options);
			expect(mockCreateBuildMainTask).toHaveBeenCalledWith(options);
			expect(mockCreateWrapPluginUiTask).toHaveBeenCalledWith(options);
			expect(mockCreateStartWebSocketsServerTask).toHaveBeenCalledWith(options);
			expect(mockCreateStartViteServerTask).toHaveBeenCalledWith(options);
		});

		test("should include all development tasks", async () => {
			const options = {
				debug: false,
				command: "dev" as const,
				mode: "development" as const,
				output: "dist",
				instanceId: "test",
				cwd: process.cwd(),
				port: 3000,
			};

			await dev(options);

			// Verify all dev-specific tasks are included
			expect(mockCreateBuildManifestTask).toHaveBeenCalled();
			expect(mockCreateBuildMainTask).toHaveBeenCalled();
			expect(mockCreateWrapPluginUiTask).toHaveBeenCalled();
			expect(mockCreateStartWebSocketsServerTask).toHaveBeenCalled();
			expect(mockCreateStartViteServerTask).toHaveBeenCalled();

			// Verify Listr has all 5 tasks
			const [tasks] = mockListr.mock.calls[0];
			expect(tasks).toHaveLength(5);
		});

		test("should log appropriate messages during execution", async () => {
			const options = {
				debug: true,
				command: "dev" as const,
				mode: "development" as const,
				output: "dist",
				instanceId: "test",
				cwd: process.cwd(),
				port: 3000,
			};

			await dev(options);

			// Verify tasks were executed
			expect(mockListrRun).toHaveBeenCalled();

			// Dev command should complete without exit
			expect(mockProcessExit).not.toHaveBeenCalled();
		});
	});

	describe("Error Handling", () => {
		test("should handle errors gracefully", async () => {
			const error = new Error("Task execution failed");
			mockListrRun.mockRejectedValueOnce(error);

			const options = {
				debug: false,
				command: "dev" as const,
				mode: "development" as const,
				output: "dist",
				instanceId: "test",
				cwd: process.cwd(),
				port: 3000,
			};

			await dev(options);

			// Verify error exit
			expect(mockProcessExit).toHaveBeenCalledWith(1);
		});

		test("should handle task creation errors", async () => {
			const error = new Error("Task creation failed");
			mockCreateBuildManifestTask.mockImplementationOnce(() => {
				throw error;
			});

			const options = {
				debug: false,
				command: "dev" as const,
				mode: "development" as const,
				output: "dist",
				instanceId: "test",
				cwd: process.cwd(),
				port: 3000,
			};

			await expect(dev(options)).rejects.toThrow("Task creation failed");
		});
	});
});
