
import fs from 'fs/promises';
import fse from 'fs-extra';
import path, { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import chokidar from 'chokidar';
import { spawn } from 'child_process';

import _ from 'lodash';
import chalk from 'chalk';
import esbuild from 'esbuild';
import { build as viteBuild, createServer, mergeConfig } from 'vite';

import { Log } from '../lib/logger.js';
import { getRandomNumber, readJson, createConfigs, getUserFiles, formatTime } from './utils.js';
import { task, run, serial } from '../task-runner/taskrunner.js';
import { suppressLogs } from '../lib/suppress-logs.js';
import { logFileUpdates } from '../lib/vite-plugins/vite-plugin-log-file-updates.js';

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);

suppressLogs();

async function loadConfig(fileName) {
	const configPath = path.resolve(process.cwd(), fileName);

	try {
		// Check if the file exists using the promises API
		await fs.access(configPath);

		// Dynamically import the module if it exists
		const configModule = await import(`${configPath}`);

		// If the file name starts with 'vite.', call the function and return its result
		if (fileName.startsWith('vite.')) {
			if (typeof configModule.default === 'function') {
				// Pass a mock context with the mode property set, e.g., 'development' or 'production'
				const context = { mode: process.env.NODE_ENV || 'development' };
				return await configModule.default(context);
			} else {
				console.warn(`The config file ${fileName} does not export a function as default.`);
				return {};
			}
		}

		// Otherwise, return the default export as-is
		return configModule.default;
	} catch (error) {
		// Handle the error if the file does not exist
		if (error.code === 'ENOENT') {
			console.warn(`Config file not found at ${configPath}. Using default config.`);
			return {}; // Return an empty config or a default configuration object
		}
		// Re-throw the error if it's not related to the file not existing
		throw error;
	}
}

export async function runScript(command, options) {

	const log = new Log({ debug: options.debug });

	// Add command to options
	options.command = command

	task('get-files', async ({ options }) => {
		const plugmaPkg = await readJson(resolve(`${__dirname}/../package.json`));
		const files = await getUserFiles();
		const config = createConfigs(options, files);

		return { plugmaPkg, files, config };
	});

	task('show-plugma-prompt', async ({ files, plugmaPkg }) => {
		log.text(`${chalk.blue.bold('Plugma')} ${chalk.grey("v" + plugmaPkg.version)}`);
	});

	task('build-manifest', async ({ files }) => {
		await fse.outputFile(
			'./dist/manifest.json',
			JSON.stringify(
				{
					...files.manifest,
					name: files.manifest.name,
					api: '1.0.0',
					main: 'main.js',
					ui: 'ui.html',
				},
				null,
				2
			)
		);
	});

	task('build-placeholder-ui', async ({ options }) => {
		const devHtmlPath = resolve(`${__dirname}/../apps/PluginWindow.html`);
		let devHtmlString = await fs.readFile(devHtmlPath, 'utf8');

		const runtimeData = `<script>
	  // Global variables defined on the window object
	  window.runtimeData = ${JSON.stringify(options)};
	</script>`;

		devHtmlString = devHtmlString.replace(/^/, runtimeData);

		await fse.mkdir(`${CURR_DIR}/dist`, { recursive: true });
		await fse.writeFile(path.join(`${CURR_DIR}/dist`, 'ui.html'), devHtmlString);

	});

	task('build-ui', async ({ command, config, options }) => {
		// Start the timer as close to the build call as possible

		// log.text('built ui')
		const startTime = performance.now();
		if (command === "build" && options.watch) {

			await viteBuild(mergeConfig({
				build: {
					watch: {},
					minify: true
				},
			}, config.vite.build));
		} else {
			await viteBuild(mergeConfig({
				build: {
					minify: true
				},
			}, config.vite.build));
		}

		// Calculate elapsed time in milliseconds
		const endTime = performance.now();
		const buildDuration = ((endTime - 250) - startTime).toFixed(0); // Remove decimals for a Vite-like appearance

		log.text(`${chalk.green('\n✓ build created in ' + buildDuration + 'ms')}`);
	});

	task('build-main', async ({ command, config }) => {
		if (options.mainBundler === "esbuild") {
			const userEsConfig = await loadConfig('esbuild.config.js');
			if (userEsConfig) {
				config.esbuild.dev = Object.assign(config.esbuild.dev, userEsConfig)
				config.esbuild.build = Object.assign(config.esbuild.build, userEsConfig)
			}
			if (command === 'dev' || command === 'preview' || command === "build" && options.watch) {
				const ctx = await esbuild.context(config.esbuild.dev);
				await ctx.watch();
			} else {
				await esbuild.build(config.esbuild.build);
			}
		} else {

			// FIXME: Had to do all of this because of two issues:
			// 1. Vite seems to be caching config when watching
			// 2. dotenv was also caching env files
			let isBuilding = false;



			const envFiles = [
				path.resolve(process.cwd(), '.env'),
				path.resolve(process.cwd(), '.env.local'),               // Default .env
				path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`), // Environment-specific .env (e.g., .env.development, .env.production)
				path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}.local`)             // Local overrides, if any
			];

			// Function to start the build
			async function runBuild() {
				if (isBuilding) {
					console.log('[vite-build] Build already in progress. Waiting for it to complete before restarting.');
					return;
				}

				isBuilding = true; // Set the flag indicating a build is in progress

				try {
					if (command === 'dev' || command === 'preview') {
						let merged = mergeConfig({ build: { watch: {}, minify: false }, plugins: [logFileUpdates()] }, config.viteMain.dev)
						await viteBuild(merged);
					}
					else if (command === "build" && options.watch) {
						let merged = mergeConfig({ build: { watch: {}, minify: true } }, config.viteMain.dev)
						await viteBuild(merged);
					} else {
						let merged = mergeConfig({ build: { minify: true } }, config.viteMain.build)
						await viteBuild(merged);
					}
				} catch (error) {
					console.error('[vite-build] Build failed:', error);
				} finally {
					isBuilding = false; // Reset the flag after the build completes
				}
			}



			// Function to watch environment files and restart the build process when changes occur
			function watchEnvFiles() {
				const watcher = chokidar.watch(envFiles);

				watcher.on('change', (filePath) => {
					console.log(`[vite-build] Environment file changed: ${filePath}. Restarting build...`);
					runBuild(); // Restart the build process without exiting
				});
			}

			// Initial build run
			runBuild();



			if (command === 'dev' || command === 'preview' || command === "build" && options.watch) {
				// Start watching for changes in environment files
				watchEnvFiles();
			}

			// if (command === 'dev' || command === "build" && options.watch) {
			// 	// We disable watching env on main as it doesn't do anything anyway
			// 	await viteBuild(_.merge({}, config.viteMain, {
			// 		build: {
			// 			watch: {

			// 			},
			// 		}
			// 	}));
			// } else {
			// 	await viteBuild(config.viteMain);
			// }
		}



	});

	task('start-vite-server', async ({ config }) => {

		console.log('\nWatching for changes...')
		const server = await createServer(config.vite.dev);
		await server.listen();


	});

	task('start-websockets-server', async ({ options }) => {
		if (options.websockets) {
			exec('node node_modules/plugma/lib/start-web-sockets-server.cjs');
			log.text(`Preview: ${chalk.cyan('http://localhost:')}${chalk.bold.cyan(options.port)}${chalk.cyan('/')}`)
		}
	})

	try {

		process.env.NODE_ENV = options.mode || 'development';
		options.port = options.port || getRandomNumber();

		// const plugmaPkg = await readJson(resolve(`${__dirname}/../package.json`));
		// const files = await getUserFiles();
		// const config = createConfigs(options, files)

		switch (command) {
			case 'dev':
			case 'preview':
				run((options) => {
					serial([
						'get-files',
						'show-plugma-prompt',
						'build-manifest',
						'build-placeholder-ui',
						'build-main',
						'start-websockets-server',
						'start-vite-server',

					], options);
				}, { command, options });
				break;

			case 'build':
				run((options) => {
					serial([
						'get-files',
						'show-plugma-prompt',
						'build-manifest',
						'build-ui',
						'build-main',
					], options);
				}, { command, options });
				break;
		}
	} catch (err) {
		console.error(`Error during ${command} process:`, err);
		process.exit(1);
	}
}
