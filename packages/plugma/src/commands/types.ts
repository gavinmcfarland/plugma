/**
 * Common types for command implementations
 */

import type { PluginOptions } from '../core/types.js'
import type { ViteDevServer } from 'vite'

export type CommandName = 'dev' | 'preview' | 'build' | 'release'

/**
 * Base options shared by all commands
 */
export interface BaseCommandOptions {
	command: CommandName
	debug?: boolean
	mode?: string
	output?: string
	cwd?: string
	config?: Record<string, unknown>
}

/**
 * Options specific to development commands (dev and preview)


/**
 * Options specific to the release command
 */
export interface ReleaseCommandOptions extends BaseCommandOptions {
	command: 'release'
	version?: string
	type?: 'stable' | 'alpha' | 'beta'
	title?: string
	notes?: string
}

/**
 * Options for the test command
 */
export type TestCommandOptions = BaseCommandOptions &
	PluginOptions & {
		/** Test files pattern */
		testMatch?: string[]
		/** Whether to watch for changes */
		watch?: boolean
		/** Test timeout in milliseconds */
		timeout?: number
		/** WebSocket server port */
		port?: number
		/** WebSocket server host */
		host?: string
		/** Whether to run in debug mode */
		debug?: boolean
	}

/**
 * Shared state for Vite server instances
 */
export interface ViteServerState {
	viteServer: ViteDevServer | null
	viteBuild: ViteDevServer | null
	viteUi: ViteDevServer | null
}
