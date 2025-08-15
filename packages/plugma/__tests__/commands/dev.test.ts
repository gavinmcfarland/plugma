import { beforeEach, describe, expect, test, vi } from "vitest";

// Hoist all mocks to ensure they're applied before imports
const mocks = vi.hoisted(() => ({
	Listr: vi.fn().mockImplementation(() => ({
		run: vi.fn().mockResolvedValue({}),
	})),
	processExit: vi.fn(),
	createBuildManifestTask: vi.fn().mockReturnValue({
		title: 'Build Manifest',
		task: vi.fn(),
	}),
	createBuildMainTask: vi.fn().mockReturnValue({
		title: 'Build Main',
		task: vi.fn(),
	}),
	createWrapPluginUiTask: vi.fn().mockReturnValue({
		title: 'Wrap Plugin UI',
		task: vi.fn(),
	}),
	createStartWebSocketsServerTask: vi.fn().mockReturnValue({
		title: 'Start WebSocket Server',
		task: vi.fn(),
	}),
	createStartViteServerTask: vi.fn().mockReturnValue({
		title: 'Start Vite Server',
		task: vi.fn(),
	}),
	Timer: vi.fn().mockImplementation(() => ({
		start: vi.fn(),
		stop: vi.fn(),
		getDuration: vi.fn().mockReturnValue("100"),
	})),
	createDebugAwareLogger: vi.fn().mockReturnValue({
		log: vi.fn(),
	}),
	chalk: {
		green: vi.fn((text) => text),
	},
	showPlugmaPrompt: vi.fn(),
}));

vi.mock("listr2", () => ({
	Listr: mocks.Listr,
	ListrLogLevels: {
		FAILED: 'FAILED',
		OUTPUT: 'OUTPUT',
	},
}));

// Mock process.exit to prevent test termination while preserving other methods
Object.defineProperty(globalThis, 'process', {
	value: {
		...globalThis.process,
		exit: mocks.processExit,
		// Preserve essential process methods for other modules
		on: globalThis.process.on?.bind(globalThis.process) || vi.fn(),
		off: globalThis.process.off?.bind(globalThis.process) || vi.fn(),
		removeListener: globalThis.process.removeListener?.bind(globalThis.process) || vi.fn(),
	},
	writable: true,
});

vi.mock("../../src/tasks/build-manifest.js", () => ({
	createBuildManifestTask: mocks.createBuildManifestTask,
}));

vi.mock("../../src/tasks/build-main.js", () => ({
	createBuildMainTask: mocks.createBuildMainTask,
}));

vi.mock("../../src/tasks/wrap-plugin-ui.js", () => ({
	createWrapPluginUiTask: mocks.createWrapPluginUiTask,
}));

vi.mock("../../src/tasks/start-websocket-server.js", () => ({
	createStartWebSocketsServerTask: mocks.createStartWebSocketsServerTask,
}));

vi.mock("../../src/tasks/start-dev-server.js", () => ({
	createStartViteServerTask: mocks.createStartViteServerTask,
}));

vi.mock("../../src/utils/timer.js", () => ({
	Timer: mocks.Timer,
}));

vi.mock("../../src/utils/debug-aware-logger.js", () => ({
	createDebugAwareLogger: mocks.createDebugAwareLogger,
}));

vi.mock("chalk", () => ({
	default: mocks.chalk,
}));

vi.mock("../../src/utils/show-plugma-prompt.js", () => ({
	showPlugmaPrompt: mocks.showPlugmaPrompt,
}));

import { dev } from "../../src/commands/dev.js";

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
			expect(mocks.Listr).toHaveBeenCalledWith(
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
			expect(mocks.createBuildManifestTask).toHaveBeenCalledWith(options);
			expect(mocks.createBuildMainTask).toHaveBeenCalledWith(options);
			expect(mocks.createWrapPluginUiTask).toHaveBeenCalledWith(options);
			expect(mocks.createStartWebSocketsServerTask).toHaveBeenCalledWith(options);
			expect(mocks.createStartViteServerTask).toHaveBeenCalledWith(options);

			// Verify Listr.run was called
			const listrInstance = mocks.Listr.mock.results[0].value;
			expect(listrInstance.run).toHaveBeenCalled();

			// Dev command should not exit (it runs continuously)
			expect(mocks.processExit).not.toHaveBeenCalled();
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
			expect(mocks.Listr).toHaveBeenCalledWith(
				expect.any(Array),
				expect.any(Object)
			);

			// Verify task factories received custom options
			expect(mocks.createBuildManifestTask).toHaveBeenCalledWith(options);
			expect(mocks.createBuildMainTask).toHaveBeenCalledWith(options);
			expect(mocks.createWrapPluginUiTask).toHaveBeenCalledWith(options);
			expect(mocks.createStartWebSocketsServerTask).toHaveBeenCalledWith(options);
			expect(mocks.createStartViteServerTask).toHaveBeenCalledWith(options);
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
			expect(mocks.createBuildManifestTask).toHaveBeenCalled();
			expect(mocks.createBuildMainTask).toHaveBeenCalled();
			expect(mocks.createWrapPluginUiTask).toHaveBeenCalled();
			expect(mocks.createStartWebSocketsServerTask).toHaveBeenCalled();
			expect(mocks.createStartViteServerTask).toHaveBeenCalled();

			// Verify Listr has all 5 tasks
			const [tasks] = mocks.Listr.mock.calls[0];
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
			const listrInstance = mocks.Listr.mock.results[0].value;
			expect(listrInstance.run).toHaveBeenCalled();

			// Dev command should complete without exit
			expect(mocks.processExit).not.toHaveBeenCalled();
		});
	});

	describe("Error Handling", () => {
		test("should handle errors gracefully", async () => {
			const error = new Error("Task execution failed");

			// Set up the mock to reject before calling dev()
			const mockRun = vi.fn().mockRejectedValue(error);
			mocks.Listr.mockImplementation(() => ({
				run: mockRun,
			}));

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
			expect(mocks.processExit).toHaveBeenCalledWith(1);
		});

		test("should handle task creation errors", async () => {
			const error = new Error("Task creation failed");
			mocks.createBuildManifestTask.mockImplementationOnce(() => {
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
