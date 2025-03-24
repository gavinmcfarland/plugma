import { join, resolve } from "node:path";
import type { RollupWatcher } from "rollup";
import { build, mergeConfig } from "vite";
/**
 * Main script build task implementation
 */
import type {
	GetTaskTypeFor,
	PluginOptions,
	ResultsOfTask,
} from "#core/types.js";
import { createViteConfigs } from "#utils/config/create-vite-configs.js";
import { Logger } from "#utils/log/logger.js";
import { GetFilesTask } from "../common/get-files.js";
import { task } from "../runner.js";
import { viteState } from "../server/vite.js";
import { loadConfig } from "#utils/config/load-config.js";

/**
 * Result type for the build-main task
 */
interface Result {
	/** Path to the built main script file */
	outputPath: string;
}

/**
 * Task that builds the plugin's main script.
 *
 * This task is responsible for:
 * 1. Building the main script using Vite:
 *    - Configures Vite for CommonJS output format
 *    - Sets up Figma API externals
 *    - Handles source maps and minification
 * 2. Managing build state:
 *    - Closes existing build server if any
 *    - Validates output files against source files
 *    - Manages watch mode for development
 *
 * The main script is built from the path specified in manifest.main and outputs to main.js.
 * In development mode:
 * - Builds are not minified for better debugging
 * - Watch mode is enabled for rebuilding on changes
 * - Output files are validated against source files
 *
 * In production mode:
 * - Output is minified
 * - Watch mode is disabled (unless explicitly enabled)
 * - Build artifacts are preserved
 *
 * @param options - Plugin build options including command, output path, etc
 * @param context - Task context containing results from previous tasks
 * @returns Object containing the output file path
 */
const buildMain = async (
	options: PluginOptions,
	context: ResultsOfTask<GetFilesTask>,
): Promise<Result> => {
	try {
		const log = new Logger({
			debug: options.debug,
			prefix: "build:main",
		});

		const fileResult = context[GetFilesTask.name];
		if (!fileResult) {
			throw new Error("get-files task must run first");
		}

		const { files } = fileResult;
		const outputPath = join(options.output || "dist", "main.js");

		// Close existing build server if any
		if (viteState.viteMainWatcher) {
			await viteState.viteMainWatcher.close();
		}

		// Only build if main script is specified
		if (!files.manifest.main) {
			log.debug("No main script specified in manifest, skipping build");
			return { outputPath };
		}

		const mainPath = resolve(files.manifest.main);
		log.debug(`Building main script from: ${mainPath}`);

		// Get the appropriate Vite config from createViteConfigs
		const configs = createViteConfigs(options, files);
		const config =
			options.command === "build" ? configs.main.build : configs.main.dev;

		const userMainConfig = await loadConfig("vite.config.main", options);

		// Build main script with Vite using the correct config
		const buildResult = await build(
			mergeConfig(
				{
					configFile: false,
					...config,
				},
				userMainConfig?.config ?? {},
			),
		);

		// Only store the watcher in watch mode
		if (
			options.watch ||
			["dev", "preview"].includes(options.command ?? "")
		) {
			viteState.viteMainWatcher = buildResult as RollupWatcher;
		}

		log.success("Main script built successfully at dist/main.js");

		return { outputPath };
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to build main script: ${errorMessage}`);
	}
};

export const BuildMainTask = task("build:main", buildMain);
export type BuildMainTask = GetTaskTypeFor<typeof BuildMainTask>;

export default BuildMainTask;
