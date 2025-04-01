import type {
	GetTaskTypeFor,
	PluginOptions,
	ResultsOfTask,
} from "#core/types.js";
import { Logger } from "#utils/log/logger.js";
import { createSocketServer } from "#core/websockets/server.js";
import { httpServer } from "./http.js";
import { GetFilesTask } from "../common/get-files.js";
import { task } from "../runner.js";

const logger = new Logger();

/**
 * Configuration for the WebSocket server
 */
interface WebSocketServerConfig {
	port: number;
	httpServer: typeof httpServer;
}

/**
 * Gets the WebSocket server port from options or environment
 * @param options Plugin options containing optional port configuration
 * @returns Configured port number
 */
const getWebSocketPort = (options: PluginOptions): number => {
	const defaultPort = 8080;
	const port = options.port || process.env.PORT || defaultPort;
	return Number(port) + 1; // WebSocket server runs on port + 1
};

/**
 * Task that starts the WebSocket server and routes messages to the correct client.
 * The WebSocket server is used by `dev`, `preview` and `test` commands.
 * WebSockets is enabled by default for `preview` or `test` commands.
 *
 * @param options - Plugin build options
 * @param context - Task context with results from previous tasks
 * @returns WebSocket server instance
 * @throws Error if server fails to start
 */
export const startWebSocketsServer = async (
	options: PluginOptions,
	context: ResultsOfTask<GetFilesTask>,
) => {
	try {
		const port = getWebSocketPort(options);

		// Start HTTP server
		await new Promise<void>((resolve) => {
			httpServer.listen(port, () => {
				logger.info(`WebSocket server listening on port ${port}`);
				resolve();
			});
		});

		// Create and configure WebSocket server
		const server = createSocketServer({
			httpServer,
		});

		return server;
	} catch (error) {
		logger.error("Failed to start WebSocket server:", error);
		throw error;
	}
};

export const StartWebSocketsServerTask = task(
	"server:websocket",
	startWebSocketsServer,
);

export type StartWebSocketsServerTask = GetTaskTypeFor<
	typeof StartWebSocketsServerTask
>;

export default StartWebSocketsServerTask;
