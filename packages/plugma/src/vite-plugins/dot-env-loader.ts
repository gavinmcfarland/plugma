import type { FSWatcher } from 'chokidar'
import chokidar from 'chokidar'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ConfigEnv, Plugin, UserConfig, ViteDevServer } from 'vite'

const rootDir = process.cwd()

interface EnvRecord {
	[key: string]: string
}

/**
 * Parses the content of an environment file into key-value pairs
 *
 * @param content - The raw content of the .env file
 * @returns An object containing the parsed environment variables
 */
function parseEnvFile(content: string): EnvRecord {
	const env: EnvRecord = {}
	const lines = content.split('\n')

	for (const line of lines) {
		// Ignore comments and empty lines
		if (line.trim() === '' || line.trim().startsWith('#')) continue

		// Split key-value pairs
		const [key, ...valueParts] = line.split('=')
		const value = valueParts.join('=').trim()

		if (key) {
			// Remove quotes from value if present
			env[key.trim()] = value.replace(/^['"]|['"]$/g, '')
		}
	}

	return env
}

/**
 * Gets the list of environment files to load based on current mode
 */
function getEnvFiles(mode: string): string[] {
	return [
		resolve(rootDir, '.env'),
		resolve(rootDir, '.env.local'),
		resolve(rootDir, `.env.${mode}`),
		resolve(rootDir, `.env.${mode}.local`),
	]
}

/**
 * Loads and merges environment variables from multiple .env files
 *
 * @param mode - Current environment mode
 * @returns An object containing all environment variables
 */
function loadEnvFiles(mode: string): EnvRecord {
	const envFiles = getEnvFiles(mode)

	// Create a new object with only string values from process.env
	const env: EnvRecord = Object.fromEntries(
		Object.entries(process.env).filter(([_, v]) => typeof v === 'string'),
	) as EnvRecord

	// Remove problematic Windows environment variables
	const envWithoutProblematicVars = { ...env }
	delete envWithoutProblematicVars['CommonProgramFiles(x86)']
	delete envWithoutProblematicVars['ProgramFiles(x86)']

	for (const file of envFiles) {
		if (existsSync(file)) {
			const content = readFileSync(file, 'utf-8')
			const parsedEnv = parseEnvFile(content)
			Object.assign(envWithoutProblematicVars, parsedEnv)
			// console.log(`[custom-env-loader] Loaded environment variables from: ${file}`)
		}
	}

	return envWithoutProblematicVars
}

/**
 * Creates Vite config with environment variables
 */
function createEnvConfig(env: EnvRecord): UserConfig {
	return {
		define: {
			...Object.fromEntries(
				Object.entries(env).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)]),
			),
		},
	}
}

/**
 * A Vite plugin that loads environment variables from .env files
 * and supports live reloading when env files change
 *
 * @param options - Optional configuration options (currently unused)
 * @returns A Vite plugin configuration object
 */
export function dotEnvLoader(options = {}): Plugin {
	let server: ViteDevServer | undefined
	let mode: string
	let watcher: FSWatcher | undefined

	return {
		name: 'plugma:dot-env-loader',

		configResolved(config) {
			mode = config.mode
		},

		config(config: UserConfig, { command }: ConfigEnv): UserConfig {
			try {
				// Load environment variables freshly for each build or serve command
				const env = loadEnvFiles(mode)
				return createEnvConfig(env)
			} catch (error) {
				console.error(`[plugma:dot-env-loader] Error loading env files: ${error}`)
				return {}
			}
		},

		configureServer(_server) {
			server = _server

			try {
				// Watch env files for changes
				const envFiles = getEnvFiles(mode)
				watcher = chokidar.watch(envFiles, {
					ignoreInitial: false,
					ignorePermissionErrors: true,
					persistent: true,
				})

				watcher.on('change', async (path: string) => {
					console.log(`[custom-env-loader] Environment file changed: ${path}`)

					try {
						// Reload environment variables
						const env = loadEnvFiles(mode)
						const newConfig = createEnvConfig(env)

						// Update server config
						if (server) {
							Object.assign(server.config.define || {}, newConfig.define)

							// Force Vite to restart and pick up new environment variables
							await server.restart()
							console.log('[custom-env-loader] Server restarted successfully')
						}
					} catch (error) {
						console.error(`[custom-env-loader] Error reloading env file ${path}: ${error}`)
					}
				})

				watcher.on('error', (err: unknown) => {
					console.error(`[custom-env-loader] Watcher error: ${err}`)
				})
			} catch (error) {
				console.error(`[custom-env-loader] Error setting up watcher: ${error}`)
			}
		},

		closeBundle() {
			if (watcher) {
				try {
					watcher.close()
					watcher = undefined
					console.log('[custom-env-loader] Watcher closed successfully')
				} catch (error) {
					console.error(`[custom-env-loader] Error closing watcher: ${error}`)
				}
			}
		},
	}
}

export default dotEnvLoader
