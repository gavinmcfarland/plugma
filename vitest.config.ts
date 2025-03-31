import { resolve } from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["**/__tests__/**/*.test.ts"],
		testTimeout: 5000,
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
		},
	},
	plugins: [tsconfigPaths()],
	resolve: {
		alias: {
			"#core": resolve(__dirname, "packages/plugma/src/core"),
			"#commands": resolve(__dirname, "packages/plugma/src/commands"),
			"#utils": resolve(__dirname, "packages/plugma/src/utils"),
			"#vite-plugins": resolve(
				__dirname,
				"packages/plugma/src/vite-plugins",
			),
			"#tasks": resolve(__dirname, "packages/plugma/src/tasks"),
			"#test": resolve(__dirname, "packages/plugma/test"),
		},
	},
});
