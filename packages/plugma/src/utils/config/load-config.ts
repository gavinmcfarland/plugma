import { existsSync } from "fs";
import { Logger } from "#utils/log/logger.js";

import { join } from "node:path";
import { loadConfigFromFile } from "vite";
import { PluginOptions } from "#core/types";

/**
 * Loads and resolves a Vite configuration file. If the specified config file is not found,
 * it falls back to the default Vite config pattern (`.vite.config.*`), matching Vite's
 * default behavior when no config file is specified.
 *
 * @param configName - The name of the config file to load (e.g. "vite.config.ui")
 * @param options - Plugin options that will be made available to the config file
 * @returns A promise that resolves to the loaded config object, or null if the config file doesn't exist
 *
 * @example
 * ```ts
 * const uiConfig = await loadConfig("vite.config.ui", pluginOptions);
 * if (uiConfig) {
 *   // Use the loaded config
 *   console.log(uiConfig.config);
 * }
 * ```
 */
export async function loadConfig(configName: string, options: PluginOptions) {
	const log = new Logger({ debug: options.debug });

	// Try to find an existing config file
	const configPaths = [
		`${configName}.ts`,
		`${configName}.js`,
		`${configName}.mjs`,
		`${configName}.cjs`,
	];

	const existingConfigPath = configPaths.find((path) =>
		existsSync(join(process.cwd(), path)),
	);

	let userConfig = null;

	userConfig = await loadConfigFromFile(
		{
			command: "build",
			mode: options.mode || process.env.NODE_ENV || "development",
		},
		existingConfigPath,
		process.cwd(),
	);
	if (userConfig) {
		log.debug(`Loaded Vite config from ${existingConfigPath}`);
	}

	return userConfig;
}
