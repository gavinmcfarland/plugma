import { registerCleanup } from '../utils/cleanup.js';
import type { ViteDevServer } from 'vite';
import { createServer } from 'vite';
import type { LogLevel } from 'vite';
import { ListrLogLevels, ListrTask } from 'listr2';
import { BuildCommandOptions, DevCommandOptions, PreviewCommandOptions } from '../utils/create-options.js';

import { createViteConfigs } from '../utils/config/create-vite-configs.js';
import { createViteServerConfig } from '../utils/config/create-server-config.js';
import { viteState } from '../utils/vite-state-manager.js';
import { getUserFiles } from '@plugma/shared';
import { createDebugAwareLogger } from '../utils/debug-aware-logger.js';
import chalk from 'chalk';
import { resolve } from 'node:path';
import { access } from 'node:fs/promises';

/**
 * Result type for the start-vite-server task
 */
export interface StartViteServerResult {
	/** The Vite dev server instance */
	server: ViteDevServer;
	/** The port the server is running on */
	port: number;
}

interface ServerContext {
	serverConfig?: any;
	viteServer?: ViteDevServer;
	vitePort?: number;
}

/**
 * Creates a listr2 task for starting the Vite development server
 */
export const createStartViteServerTask = <T extends { viteServer?: ViteDevServer; vitePort?: number }>(
	options: DevCommandOptions | PreviewCommandOptions,
): ListrTask<T> => {
	return {
		title: 'Start Vite Server',
		task: async (ctx, task) => {
			const logger = createDebugAwareLogger(options.debug);

			// Check if UI is specified in manifest first
			const files = await getUserFiles(options);
			if (!files.manifest.ui) {
				logger.log(ListrLogLevels.SKIPPED, 'No UI specified in manifest, skipping start-dev-server');
				return ctx;
			}

			// Check if UI file exists
			const uiPath = resolve(files.manifest.ui);
			const fileExists = await access(uiPath)
				.then(() => true)
				.catch(() => false);

			if (!fileExists) {
				const error = new Error(`UI file not found at ${uiPath}`);
				logger.log(ListrLogLevels.FAILED, error.message);
				throw error;
			}

			console.log(`${chalk.blue(`➔ http://localhost:${options.port}`)}\n`);

			return task.newListr(
				[
					{
						title: 'Closing existing server',
						task: async () => {
							if (viteState.viteServer) {
								logger.log(ListrLogLevels.OUTPUT, 'Closing existing Vite server...');
								await viteState.viteServer.close();
								viteState.viteServer = null;
							}
						},
					},
					{
						title: 'Setting up cleanup handlers',
						task: async () => {
							registerCleanup(async () => {
								if (viteState.viteServer) {
									try {
										await viteState.viteServer.close();
										viteState.viteServer = null;
										logger.log(ListrLogLevels.OUTPUT, 'UI server closed');
									} catch (error) {
										logger.log(ListrLogLevels.FAILED, [
											'Failed to close Vite server:',
											error instanceof Error ? error.message : String(error),
										]);
									}
								}

								if (viteState.viteMain) {
									try {
										await viteState.viteMain.close();
										logger.log(ListrLogLevels.OUTPUT, 'Main watcher closed');
									} catch (error) {
										logger.log(ListrLogLevels.FAILED, [
											'Failed to close Vite main watcher:',
											error instanceof Error ? error.message : String(error),
										]);
									}
								}

								try {
									await viteState.viteUi.close();
									logger.log(ListrLogLevels.OUTPUT, 'UI server closed');
								} catch (error) {
									logger.log(ListrLogLevels.FAILED, [
										'Failed to close Vite UI server:',
										error instanceof Error ? error.message : String(error),
									]);
								}

								viteState.isBuilding = false;
								viteState.messageQueue = [];
							});
						},
					},
					{
						title: 'Creating server configuration',
						task: async (ctx: ServerContext) => {
							const configs = createViteConfigs(options, files);
							ctx.serverConfig = await createViteServerConfig(options, files, configs);
						},
					},
					{
						title: 'Starting Vite server',
						task: async (ctx: ServerContext) => {
							task.output = 'Starting Vite server...';

							if (!ctx.serverConfig) {
								throw new Error('Server configuration not found');
							}

							const server = await createServer(ctx.serverConfig).catch((error) => {
								const message = error instanceof Error ? error.message : String(error);
								throw new Error(`Failed to create Vite server: ${message}`);
							});

							const resolvedPort = server.config.server.port || options.port;

							await server.listen();

							logger.log(ListrLogLevels.OUTPUT, `Starting dev server`);

							server.watcher.on('change', async (file) => {
								if (viteState.isBuilding) {
									task.output = ['Build in progress, queueing file change:', file];
									return;
								}
								viteState.isBuilding = true;
								try {
									server.moduleGraph.invalidateAll();
									server.ws.send({ type: 'full-reload' });
								} finally {
									viteState.isBuilding = false;
									for (const { message, senderId } of viteState.messageQueue) {
										server.ws.send(message, { senderId });
									}
									viteState.messageQueue = [];
								}
							});

							viteState.viteServer = server;
							ctx.viteServer = server;
							ctx.vitePort = resolvedPort as number;

							return {
								server,
								port: resolvedPort as number,
							};
						},
					},
				],
				{ concurrent: false },
			);
		},
	};
};
