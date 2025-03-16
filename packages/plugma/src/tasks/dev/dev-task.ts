import type { DevCommandOptions } from "#commands/types.js";
import type { RegisteredTask } from "#core/task-runner/types.js";
import type { PluginOptions } from "#core/types.js";
import {
	BuildMainTask,
	BuildManifestTask,
	GetFilesTask,
	ShowPlugmaPromptTask,
	StartViteServerTask,
	StartWebSocketsServerTask,
	WrapPluginUiTask,
} from "#tasks";
import { serial } from "#tasks/runner.js";
import { nanoid } from "nanoid";
import { getRandomPort } from "../../utils/get-random-port.js";
import { task } from "../runner.js";

// Define the return type interface
interface DevTaskResult {
	success: boolean;
	// Add other properties if needed
}

const devTaskRunner = async (
	options: DevCommandOptions,
): Promise<DevTaskResult> => {
	const pluginOptions = {
		...options,
		mode: options.mode || "development",
		instanceId: nanoid(),
		port: options.port || getRandomPort(),
		output: options.output || "dist",
		command: "dev" as const,
		cwd: options.cwd || process.cwd(),
	};

	await serial(
		GetFilesTask,
		ShowPlugmaPromptTask,
		BuildManifestTask,
		WrapPluginUiTask,
		BuildMainTask,
		StartWebSocketsServerTask,
		StartViteServerTask,
	)(pluginOptions);

	return { success: true };
};

export const DevTask = task("dev", devTaskRunner);
