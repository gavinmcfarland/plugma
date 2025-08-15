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
	createBuildUiTask: vi.fn().mockReturnValue({
		title: 'Build UI',
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
}));

// Mock Listr2
vi.mock("listr2", () => ({
	Listr: mocks.Listr,
	ListrLogLevels: {
		FAILED: 'FAILED',
	},
}));

// Mock process.exit - this is crucial to prevent actual process termination
vi.mock("node:process", () => ({
	exit: mocks.processExit,
}));

// Also mock the global process object
Object.defineProperty(globalThis, 'process', {
	value: {
		...globalThis.process,
		exit: mocks.processExit,
		cwd: vi.fn().mockReturnValue('/test/cwd'),
	},
	writable: true,
});

// Mock the task factory functions
vi.mock("../../src/tasks/build-manifest.js", () => ({
	createBuildManifestTask: mocks.createBuildManifestTask,
}));

vi.mock("../../src/tasks/build-main.js", () => ({
	createBuildMainTask: mocks.createBuildMainTask,
}));

vi.mock("../../src/tasks/build-ui.js", () => ({
	createBuildUiTask: mocks.createBuildUiTask,
}));

// Mock other dependencies
vi.mock("../../src/utils/timer.js", () => ({
	Timer: mocks.Timer,
}));

vi.mock("../../src/utils/debug-aware-logger.js", () => ({
	createDebugAwareLogger: mocks.createDebugAwareLogger,
}));

vi.mock("../../src/constants.js", () => ({
	DEFAULT_RENDERER_OPTIONS: {},
	SILENT_RENDERER_OPTIONS: {},
}));

vi.mock("chalk", () => ({
	default: mocks.chalk,
}));

describe("Build Command", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset the Listr mock to successful behavior
		mocks.Listr.mockImplementation(() => ({
			run: vi.fn().mockResolvedValue({}),
		}));
	});

	test("should execute build command successfully", async () => {
		const { build } = await import("../../src/commands/build.js");

		const options = {
			debug: false,
			command: "build" as const,
			mode: "development" as const,
			output: "dist",
			instanceId: "test",
			cwd: "/test/cwd",
		};

		await build(options);

		// Verify Listr was called
		expect(mocks.Listr).toHaveBeenCalled();

		// Verify the tasks array has 3 items (manifest, main, ui)
		const listrCall = mocks.Listr.mock.calls[0];
		const tasks = listrCall[0];
		expect(tasks).toHaveLength(3);

		// Verify concurrent option
		const config = listrCall[1];
		expect(config).toMatchObject({ concurrent: true });

		// Verify successful exit was called
		expect(mocks.processExit).toHaveBeenCalledWith(0);
	});

	test("should handle errors and exit with code 1", async () => {
		// Mock Listr to throw an error
		mocks.Listr.mockImplementationOnce(() => ({
			run: vi.fn().mockRejectedValue(new Error("Build failed")),
		}));

		const { build } = await import("../../src/commands/build.js");

		const options = {
			debug: false,
			command: "build" as const,
			mode: "development" as const,
			output: "dist",
			instanceId: "test",
			cwd: "/test/cwd",
		};

		await build(options);

		// Verify process.exit was called with error code
		expect(mocks.processExit).toHaveBeenCalledWith(1);
	});

	test("should use debug renderer options when debug is true", async () => {
		const { build } = await import("../../src/commands/build.js");

		const options = {
			debug: true,
			command: "build" as const,
			mode: "development" as const,
			output: "dist",
			instanceId: "test",
			cwd: "/test/cwd",
		};

		await build(options);

		// Verify Listr was called with config
		expect(mocks.Listr).toHaveBeenCalled();
		const config = mocks.Listr.mock.calls[0][1];
		expect(config).toHaveProperty('concurrent', true);

		// Should exit successfully
		expect(mocks.processExit).toHaveBeenCalledWith(0);
	});

	test("should handle watch mode without exiting", async () => {
		const { build } = await import("../../src/commands/build.js");

		const options = {
			debug: false,
			command: "build" as const,
			mode: "development" as const,
			output: "dist",
			instanceId: "test",
			cwd: "/test/cwd",
			watch: true,
		};

		await build(options);

		// Verify Listr was called
		expect(mocks.Listr).toHaveBeenCalled();

		// In watch mode, process.exit(0) should not be called
		expect(mocks.processExit).not.toHaveBeenCalledWith(0);
		// But process.exit(1) should also not be called (no errors)
		expect(mocks.processExit).not.toHaveBeenCalledWith(1);
	});
});
