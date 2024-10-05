import esbuild from 'esbuild';
import { build as viteBuild, createServer } from 'vite';
import fse from 'fs-extra';
import fs from 'fs';
import { dirname, resolve, join } from 'path';
import { exec } from 'child_process';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import _ from 'lodash';
import path from 'path';



import { Log } from '../lib/logger.js';
import { getRandomNumber, readJson, createConfigs, getUserFiles } from './utils.js';

import { task, run, serial } from '../task-runner/taskrunner.js';

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);

// export default async function cli(command, options) {
// 	const log = new Log({ debug: options.debug });
// 	process.env.NODE_ENV = options.mode || 'development';
// 	options.port = options.port || getRandomNumber();

// 	const plugmaPkg = await readJson(resolve(`${__dirname}/../package.json`));
// 	const userFiles = await getUserFiles();
// 	const config = createConfigs(options, userFiles)

// 	log.text(`${chalk.blue.bold('Plugma')} ${chalk.grey("v" + plugmaPkg.version)}`);

// 	try {

// 		// Build manifest
// 		const newManifest = {
// 			...userFiles.manifest,
// 			name: userFiles.manifest.name,
// 			api: '1.0.0',
// 			main: 'main.js',
// 			ui: 'ui.html',
// 		};

// 		await fse.outputFile('./dist/manifest.json', JSON.stringify(newManifest, null, 2));

// 		if (command === 'dev' || command === 'preview') {
// 			// Build UI file
// 			let devHtmlString = fs.readFileSync(resolve(`${__dirname}/../apps/PluginWindow.html`), 'utf8');

// 			let runtimeData = `<script>
// 				// Global variables defined on the window object
// 				window.runtimeData = {
// 					port: ${options.port},
// 					debug: ${options.debug},
// 					websockets: ${options.websockets}
// 				};
// 			</script>`

// 			devHtmlString = devHtmlString.replace(/^/, runtimeData)

// 			createFileWithDirectory(`${CURR_DIR}/dist`, 'ui.html', devHtmlString)

// 			// Start UI server
// 			const server = await createServer(config.vite.dev);
// 			await server.listen();
// 			log.format({ indent: 1 }).text(`Preview: ${chalk.cyan(`http://localhost:${options.port}/`)}`);
// 			log.text(`\nWatching for changes...\n`);
// 			if (options.websockets) {
// 				exec('node node_modules/plugma/lib/start-web-sockets-server.cjs');
// 			}
// 		} else if (command === 'build') {
// 			if (options.watch) {
// 				// Build UI file
// 				await build(_.merge({}, config.vite.build, { build: { watch: {} } }));
// 			} else {
// 				// Build UI file
// 				await build(config.vite.build);
// 			}
// 		}

// 		if (options.watch) {
// 			// Build main file
// 			const ctx = await esbuild.context(config.esbuild[command ? 'dev' : 'build']);
// 			await ctx.watch();
// 		} else {
// 			// Build main file
// 			await esbuild.build(config.esbuild[command ? 'dev' : 'build']);
// 		}


// 	} catch (err) {
// 		console.error(`Error during ${command} process:`, err);
// 		process.exit(1);
// 	}
// }





export default async function cli(command, options) {

	const log = new Log({ debug: options.debug });

	task(['build-manifest', 'watch-manifest'], async ({ files }) => {
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
		let devHtmlString = fs.readFileSync(devHtmlPath, 'utf8');

		const runtimeData = `<script>
	  // Global variables defined on the window object
	  window.runtimeData = {
	    port: ${options.port},
	    debug: ${options.debug},
	    websockets: ${options.websockets}
	  };
	</script>`;

		devHtmlString = devHtmlString.replace(/^/, runtimeData);

		await fse.mkdir(`${CURR_DIR}/dist`, { recursive: true });
		await fse.writeFile(path.join(`${CURR_DIR}/dist`, 'ui.html'), devHtmlString);

	});

	task('build-ui', async ({ command, config, options }) => {
		if (command === 'dev' || options.watch) {
			await viteBuild(_.merge({}, config.vite.build, { build: { watch: {} } }));
		} else {
			await viteBuild(config.vite.build);
		}
	});

	task(['build-main', 'watch-main'], async ({ command, config }) => {
		if (command === 'dev' || command === 'preview') {
			const ctx = await esbuild.context(config.esbuild.dev);
			await ctx.watch();
		} else {
			await esbuild.build(config.esbuild.build);
		}
	});

	task('start-vite-server', async ({ config }) => {
		const server = await createServer(config.vite.dev);
		await server.listen();
	});

	task('start-websockets-server', async ({ options }) => {
		if (options.websockets) {
			exec('node node_modules/plugma/lib/start-web-sockets-server.cjs');
			log.text(`Preview: ${chalk.cyan('http://localhost:')}${chalk.bold.cyan(options.port)}${chalk.cyan('/')}\n`)
		}
	})

	try {

		process.env.NODE_ENV = options.mode || 'development';
		options.port = options.port || getRandomNumber();

		const plugmaPkg = await readJson(resolve(`${__dirname}/../package.json`));
		const files = await getUserFiles();
		const config = createConfigs(options, files)

		log.text(`${chalk.blue.bold('Plugma')} ${chalk.grey("v" + plugmaPkg.version)}\n`);

		switch (command) {
			case 'dev':
			case 'preview':

				run((options) => {
					serial([
						'watch-manifest',
						'build-placeholder-ui',
						'watch-main',
						'start-vite-server',
						'start-websockets-server'
					], options);
				}, { command, options, files, config });
				break;

			case 'build':
				run((options) => {
					serial([
						'build-manifest',
						'build-ui',
						'build-main',
					], options);
				}, { command, options, files, config });
				break;
		}
	} catch (err) {
		console.error(`Error during ${command} process:`, err);
		process.exit(1);
	}
}
