import { glob } from 'glob'
import { relative } from 'node:path'
import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface InjectTestsOptions {
	/**
	 * Base directory to search for test files.
	 * Use "" to search from project root, defaults to "src"
	 */
	testDir?: string
	pluginOptions?: {
		manifest?: {
			main?: string
		}
	}
}

const DEFAULT_VITEST_PATTERNS = [
	'**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
	'**/test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
	'**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
	'**/tests/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
	'**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
]

/**
 * Creates a Vite plugin that injects imports for all test files at the top of the main entry file.
 * This ensures all tests are loaded and executed when the plugin starts.
 *
 * @param options - Configuration options for test file injection
 * @returns A Vite plugin configuration object
 */
export function injectTests(options: any = {}): Plugin {
	const { testDir = 'src' } = options

	return {
		name: 'plugma:inject-tests',
		enforce: 'post',
		async transform(code: string, id: string) {
			const mainFile = options.pluginOptions?.manifest?.main ?? ''

			if (!id.endsWith(mainFile)) {
				return null
			}

			try {
				// Try to find and load vitest.config
				let testPatterns = DEFAULT_VITEST_PATTERNS
				try {
					const vitestConfig = await import(process.cwd() + '/vitest.config.ts')
					if (vitestConfig.default?.test?.include) {
						testPatterns = vitestConfig.default.test.include
					}
				} catch (e) {
					// Config file doesn't exist, use defaults
				}

				const testFiles: string[] = [
					...new Set(
						(
							await Promise.all(
								testPatterns.map((pattern) =>
									glob(pattern, {
										cwd: testDir,
										absolute: true,
										ignore: ['**/node_modules/**'],
									}),
								),
							)
						).flat(),
					),
				].filter((file) => file.endsWith('.ts') || file.endsWith('.js'))

				// Filter files that contain 'plugma/testing' in their contents
				const filteredTestFiles = await Promise.all(
					testFiles.map(async (file) => {
						const content = await fs.promises.readFile(file, 'utf-8')
						return content.includes('plugma/testing') ? file : null
					}),
				).then((files) => files.filter((file): file is string => file !== null))

				console.log(`Found ${filteredTestFiles.length} test files to inject:`, filteredTestFiles)

				if (filteredTestFiles.length === 0) {
					return null
				}

				// Generate import statements for each test file using absolute paths
				const imports = filteredTestFiles
					.map((file) => {
						// Convert absolute paths to proper module imports
						const importPath = file
							.replace(process.cwd(), '') // Remove the current working directory
							.replace(/^\/?/, '/') // Ensure path starts with /
						return `import '${importPath}';`
					})
					.join('\n')

				// FIXME: We inject the message event handlers here, because they need to appear before tests are registered, however there must be a cleaner way to do this
				return {
					code: `import { initializeTestHandlers } from '${__dirname}/../../testing/figma/handlers';\ninitializeTestHandlers();\n${imports}\n${code}`,
					map: null,
				}
			} catch (error) {
				console.error('Error injecting test files:', error)
				return null
			}
		},
	}
}

export default injectTests
