/**
 * Development command implementation
 * Handles development server and file watching for plugin development
 */

import type { TestCommandOptions } from "#commands/types.js";
import { DevTask } from "#tasks/dev/dev-task.js";
import { RunTests } from "#tasks/test/run-vitest.js";

import { Logger } from "#utils/log/logger.js";
import { nanoid } from "nanoid";
import { serial } from "../tasks/runner.js";
import type { BuildCommandOptions } from "./types.js";

/**
 * Main build command implementation
 * Creates production-ready builds of the plugin
 *
 * @param options - Build configuration options
 * @remarks
 * The build command creates optimized production builds:
 * - Minified and optimized code
 * - Production UI build
 * - Manifest generation
 * - Optional watch mode for development
 */
export async function test(options: TestCommandOptions): Promise<void> {
	const log = new Logger({ debug: options.debug });

	try {
		log.info("Starting production build...");
		log.debug(`Build options: ${JSON.stringify(options)}`);

		// NOTE: Manually set port to 9000 for vitetest server
		const pluginOptions = {
			...options,
			mode: options.mode || "production",
			instanceId: nanoid(),
			port: 9000,
			output: options.output || "dist",
			command: "dev" as const,
		};

		log.debug(`Plugin options: ${JSON.stringify(pluginOptions)}`);

		// Execute tasks in sequence
		log.info("Executing tasks...");

		// Pass the task objects
		const results = await serial(DevTask, RunTests)(pluginOptions);

		// log.debug(`Task execution results: ${JSON.stringify(results, null, 2)}`);

		log.success("Production build completed successfully");
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		log.error("Failed to build plugin:", errorMessage);
		throw error;
	}
}
