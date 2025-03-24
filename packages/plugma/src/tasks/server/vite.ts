/**
 * Vite server task implementation
 */

import type {
	GetTaskTypeFor,
	PluginOptions,
	ResultsOfTask,
} from "#core/types.js";
import { registerCleanup } from "#utils/cleanup.js";
import { Logger } from "#utils/log/logger.js";
import type { RollupWatcher } from "rollup";
import type { ViteDevServer } from "vite";
import { loadConfigFromFile } from "vite";
import { createServer } from "vite";
import { GetFilesTask } from "../common/get-files.js";
import { task } from "../runner.js";
import type { LogLevel } from "vite";

/**
 * Result type for the start-vite-server task
 */
export interface StartViteServerResult {
	/** The Vite dev server instance */
	server: ViteDevServer;
	/** The port the server is running on */
	port: number;
}

/**
 * Shared Vite server state to manage server instances and build queue
 */
export const viteState = {
	/** Main Vite development server */
	viteServer: null as ViteDevServer | null,
	/** Build-specific Vite watcher */
	viteMainWatcher: null as RollupWatcher | null,
	/** UI-specific Vite server */
	viteUi: null as ViteDevServer | null,
	/** Flag to track if a build is in progress */
	isBuilding: false,
	/** Queue of messages to process after build */
	messageQueue: [] as Array<{ message: string; senderId: string }>,
};

/**
 * Task that starts and manages the Vite development server.
 *
 * This task is responsible for:
 * 1. Server Lifecycle:
 *    - Starting the Vite dev server
 *    - Managing server state
 *    - Ensuring proper server shutdown
 * 2. Configuration:
 *    - Setting up HMR and middleware
 *    - Configuring source maps
 *    - Managing dependencies
 * 3. Development Features:
 *    - Hot Module Replacement
 *    - Source map handling
 *    - Port management
 *
 * The server is only started when:
 * - Running in dev/preview mode
 * - UI is specified in manifest
 * - Required files exist
 *
 * @param options - Plugin build options including command, output path, etc
 * @param context - Task context containing results from previous tasks
 * @returns Object containing server instance and port
 */
const startViteServer = async (
	options: PluginOptions,
	context: ResultsOfTask<GetFilesTask>,
): Promise<StartViteServerResult> => {
	try {
		const log = new Logger({ debug: options.debug });

		// Get files from previous task
		const fileResult = context[GetFilesTask.name];
		if (!fileResult) {
			throw new Error("get-files task must run first");
		}

		const { files, config } = fileResult;

		// Skip if no UI is specified
		if (!files.manifest.ui) {
			log.debug("No UI specified in manifest, skipping Vite server");
			throw new Error(
				"UI must be specified in manifest to start Vite server",
			);
		}

		// Close existing server if any
		if (viteState.viteServer) {
			log.debug("Closing existing Vite server...");
			await viteState.viteServer.close();
			viteState.viteServer = null;
		}

		// Register cleanup handler
		registerCleanup(async () => {
			log.debug("Cleaning up Vite server...");

			// Close the Vite server if it exists
			if (viteState.viteServer) {
				try {
					await viteState.viteServer.close();
					viteState.viteServer = null;
					log.success("Vite server closed");
				} catch (error) {
					log.error("Failed to close Vite server:", error);
				}
			}

			// Close the main watcher if it exists
			if (viteState.viteMainWatcher) {
				try {
					await viteState.viteMainWatcher.close();
					viteState.viteMainWatcher = null;
					log.success("Vite main watcher closed");
				} catch (error) {
					log.error("Failed to close Vite main watcher:", error);
				}
			}

			// Close the UI server if it exists
			if (viteState.viteUi) {
				try {
					await viteState.viteUi.close();
					viteState.viteUi = null;
					log.success("Vite UI server closed");
				} catch (error) {
					log.error("Failed to close Vite UI server:", error);
				}
			}

			// Reset state
			viteState.isBuilding = false;
			viteState.messageQueue = [];
		});

		log.debug("Starting Vite server...");

		// Load user's config file if it exists
		const userConfig = await loadConfigFromFile({
			command: "serve",
			mode: options.mode || process.env.NODE_ENV || "development",
		});

		// Base config for the Vite server
		const baseConfig = {
			...config.ui.dev,
			root: process.cwd(),
			base: "/",
			server: {
				port: options.port,
				strictPort: true,
				cors: true,
				host: "localhost",
				middlewareMode: false,
				sourcemapIgnoreList: () => true,
				hmr: {
					port: options.port,
					protocol: "ws",
					host: "localhost",
				},
				fs: {
					// Disable Vite's caching for certain files
					strict: false,
					allow: ["."],
				},
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods":
						"GET,HEAD,PUT,PATCH,POST,DELETE",
					"Access-Control-Allow-Headers":
						"Origin, X-Requested-With, Content-Type, Accept, Range",
					"Access-Control-Expose-Headers": "Content-Range",
				},
			},
			optimizeDeps: {
				entries: [
					files.manifest.ui || "",
					files.manifest.main || "",
				].filter(Boolean),
				// Force Vite to rebuild dependencies
				force: true,
			},
			// Clear module cache on file changes
			clearScreen: false,
			logLevel: (options.debug ? "info" : "error") as LogLevel,
		};

		// Configure Vite server with caching workarounds
		const server = await createServer({
			configFile: false,
			...baseConfig,
			...userConfig?.config,
		}).catch((error) => {
			const message =
				error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to create Vite server: ${message}`);
		});

		// Start the server
		try {
			const resolvedPort = server.config.server.port || options.port;
			await server.listen();

			// Setup file watchers with caching workarounds
			server.watcher.on("change", async (file) => {
				if (viteState.isBuilding) {
					log.debug("Build in progress, queueing file change:", file);
					return;
				}
				viteState.isBuilding = true;
				try {
					// Clear module cache
					server.moduleGraph.invalidateAll();
					// Force HMR update
					server.ws.send({ type: "full-reload" });
				} finally {
					viteState.isBuilding = false;
					// Process queued messages
					for (const {
						message,
						senderId,
					} of viteState.messageQueue) {
						server.ws.send(message, { senderId });
					}
					viteState.messageQueue = [];
				}
			});

			log.success(
				`Vite server running at http://localhost:${resolvedPort}`,
			);

			// Store server instance
			viteState.viteServer = server;

			return {
				server,
				port: resolvedPort,
			};
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to start Vite server: ${message}`);
		}
	} catch (error) {
		// Re-throw with context if not already a server error
		if (error instanceof Error && !error.message.includes("Vite server")) {
			throw new Error(`Vite server task failed: ${error.message}`);
		}
		throw error;
	}
};

export const StartViteServerTask = task("server:start-vite", startViteServer);
export type StartViteServerTask = GetTaskTypeFor<typeof StartViteServerTask>;

export default StartViteServerTask;
