import { existsSync } from "fs";
import { Logger } from "#utils/log/logger.js";

import { join } from "node:path";
import { loadConfigFromFile } from "vite";

export async function loadConfig(configBaseName: string, options: any) {
	const log = new Logger({ debug: options.debug });

	// Try to find an existing config file
	const configPaths = [
		`${configBaseName}.ts`,
		`${configBaseName}.js`,
		`${configBaseName}.mjs`,
		`${configBaseName}.cjs`,
	];

	const existingConfigPath = configPaths.find((path) =>
		existsSync(join(process.cwd(), path)),
	);

	console.log("existingConfigPath", existingConfigPath);

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

	console.log("userConfig", userConfig);

	return userConfig;
}
