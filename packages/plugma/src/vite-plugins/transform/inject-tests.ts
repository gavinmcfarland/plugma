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
export function injectTests(options: InjectTestsOptions = {}): Plugin {
	const { testDir = "src" } = options;

	return {
		name: "plugma:inject-tests",
		enforce: "post",
		async transform(code: string, id: string) {
			if (!id.endsWith(options.pluginOptions?.manifest?.main ?? "")) {
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

				// Find all test files matching the patterns
				const testFiles = await Promise.all(
					testPatterns.map((pattern) =>
						glob(pattern, {
							cwd: testDir,
							absolute: false,
						}),
					),
				);

				// Flatten and deduplicate results
				const uniqueTestFiles = [...new Set(testFiles.flat())];

				if (uniqueTestFiles.length === 0) {
					return null;
				}

				// Generate import statements for each test file
				const imports = uniqueTestFiles
					.map((file) => {
						const relativePath = relative(
							id.substring(0, id.lastIndexOf("/")),
							`${testDir}/${file}`,
						);
						return `import '${relativePath}';`;
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
