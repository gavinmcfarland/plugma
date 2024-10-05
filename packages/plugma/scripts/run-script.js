
import fs from 'fs';
import fse from 'fs-extra';
import path, { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

import _ from 'lodash';
import chalk from 'chalk';
import esbuild from 'esbuild';
import { build as viteBuild, createServer } from 'vite';

import { Log } from '../lib/logger.js';
import { getRandomNumber, readJson, createConfigs, getUserFiles } from './utils.js';
import { task, run, serial } from '../task-runner/taskrunner.js';

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);

export async function runScript(command, options) {

	const log = new Log({ debug: options.debug });

	task('get-files', async ({ options }) => {
		const plugmaPkg = await readJson(resolve(`${__dirname}/../package.json`));
		const files = await getUserFiles();
		const config = createConfigs(options, files);

		return { plugmaPkg, files, config };
	});

	task('show-plugma-prompt', async ({ files, plugmaPkg }) => {
		log.text(`${chalk.blue.bold('Plugma')} ${chalk.grey("v" + plugmaPkg.version)}\n`);
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
		let devHtmlString = fs.readFileSync(devHtmlPath, 'utf8');

		const runtimeData = `<script>
	  // Global variables defined on the window object
	  window.runtimeData = ${JSON.stringify(options)};
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

	task('build-main', async ({ command, config }) => {
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
						'start-vite-server',
						'start-websockets-server'
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
