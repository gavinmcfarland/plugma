import { glob } from "glob";
import { relative } from "node:path";
import type { Plugin } from "vite";

interface InjectTestsOptions {
	/**
	 * Base directory to search for test files.
	 * Use "" to search from project root, defaults to "src"
	 */
	testDir?: string;
	pluginOptions?: {
		manifest?: {
			main?: string;
		};
	};
}

const DEFAULT_VITEST_PATTERNS = [
	"**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
	"**/test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
	"**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
	"**/tests/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
	"**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
];

/**
 * Creates a Vite plugin that injects imports for all test files at the top of the main entry file.
 * This ensures all tests are loaded and executed when the plugin starts.
 *
 * @param options - Configuration options for test file injection
 * @returns A Vite plugin configuration object
 */
export function injectTests(options: any = {}): Plugin {
	const { testDir = "src" } = options;

	return {
		name: "plugma:inject-tests",
		enforce: "post",
		async transform(code: string, id: string) {
			const mainFile = options.pluginOptions?.manifest?.main ?? "";
			if (!id.endsWith(mainFile)) {
				return null;
			}

			try {
				// Try to find and load vitest.config
				let testPatterns = DEFAULT_VITEST_PATTERNS;
				try {
					const vitestConfig = await import(
						process.cwd() + "/vitest.config.ts"
					);
					if (vitestConfig.default?.test?.include) {
						testPatterns = vitestConfig.default.test.include;
					}
				} catch (e) {
					// Config file doesn't exist, use defaults
				}

				const testFiles = [
					...new Set(
						(
							await Promise.all(
								testPatterns.map((pattern) =>
									glob(pattern, {
										cwd: testDir,
										absolute: true,
										ignore: ["**/node_modules/**"],
									}),
								),
							)
						).flat(),
					),
				];

				console.log(
					`Found ${testFiles.length} test files to inject:`,
					testFiles,
				);

				if (testFiles.length === 0) {
					return null;
				}

				// Generate import statements for each test file using absolute paths
				const imports = testFiles
					.map((file) => {
						// Convert absolute paths to proper module imports
						const importPath = file
							.replace(process.cwd(), "") // Remove the current working directory
							.replace(/^\/?/, "/"); // Ensure path starts with /
						return `import '${importPath}';`;
					})
					.join("\n");

				return {
					code: `${imports}\n${code}`,
					map: null,
				};
			} catch (error) {
				console.error("Error injecting test files:", error);
				return null;
			}
		},
	};
}

export default injectTests;
