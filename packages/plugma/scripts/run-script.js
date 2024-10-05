import { createServer, build } from 'vite';
import esbuild from 'esbuild';
import fse from 'fs-extra';
import fs from 'fs';
import { dirname, resolve, join } from 'path';
import { exec } from 'child_process';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import _ from 'lodash';

import { Log } from '../lib/logger.js';
import { createFileWithDirectory, getRandomNumber, readJson, createConfigs, getUserFiles } from './utils.js';

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);

export default async function cli(command, options) {
	const log = new Log({ debug: options.debug });
	process.env.NODE_ENV = options.mode || 'development';
	options.port = options.port || getRandomNumber();

	const plugmaPkg = await readJson(resolve(`${__dirname}/../package.json`));
	const userFiles = await getUserFiles();
	const config = createConfigs(options, userFiles)

	log.text(`${chalk.blue.bold('Plugma')} ${chalk.grey("v" + plugmaPkg.version)}`);

	try {

		// Build manifest
		const newManifest = {
			...userFiles.manifest,
			name: userFiles.manifest.name,
			api: '1.0.0',
			main: 'main.js',
			ui: 'ui.html',
		};

		await fse.outputFile('./dist/manifest.json', JSON.stringify(newManifest, null, 2));

		if (command === 'dev' || command === 'preview') {
			// Build UI file
			let devHtmlString = fs.readFileSync(resolve(`${__dirname}/../apps/PluginWindow.html`), 'utf8');

			let runtimeData = `<script>
				// Global variables defined on the window object
				window.runtimeData = {
					port: ${options.port},
					debug: ${options.debug},
					websockets: ${options.websockets}
				};
			</script>`

			devHtmlString = devHtmlString.replace(/^/, runtimeData)

			createFileWithDirectory(`${CURR_DIR}/dist`, 'ui.html', devHtmlString)

			// Start UI server
			const server = await createServer(config.vite.dev);
			await server.listen();
			log.format({ indent: 1 }).text(`Preview: ${chalk.cyan(`http://localhost:${options.port}/`)}`);
			log.text(`\nWatching for changes...\n`);
			if (options.websockets) {
				exec('node node_modules/plugma/lib/start-web-sockets-server.cjs');
			}
		} else if (command === 'build') {
			if (options.watch) {
				// Build UI file
				await build(_.merge({}, config.vite.build, { build: { watch: {} } }));
			} else {
				// Build UI file
				await build(config.vite.build);
			}
		}

		if (options.watch) {
			// Build main file
			const ctx = await esbuild.context(config.esbuild[command ? 'dev' : 'build']);
			await ctx.watch();
		} else {
			// Build main file
			await esbuild.build(config.esbuild[command ? 'dev' : 'build']);
		}


	} catch (err) {
		console.error(`Error during ${command} process:`, err);
		process.exit(1);
	}
}
