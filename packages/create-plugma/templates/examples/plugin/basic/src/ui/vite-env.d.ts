/// <reference types="vite/client" />

import "vite";
import type { UserConfigExport } from "vite";

declare module "vite" {
	interface ConfigEnv {
		context?: "ui" | "main";
	}

	// Overload defineConfig to acknowledge the context parameter
	function defineConfig(
		config: (env: ConfigEnv) => UserConfigExport,
	): UserConfigExport;
}
