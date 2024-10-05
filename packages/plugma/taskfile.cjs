import { promises as fse } from 'fs';
import fs from 'fs';
import path, { resolve } from 'path';
import esbuild from 'esbuild';
import { build as viteBuild, createServer } from 'vite';
import _ from 'lodash';

const CURR_DIR = process.cwd();
const __dirname = path.dirname(new URL(import.meta.url).pathname);

module.exports = function (task) {

	task('test-task', () => {
		console.log("testing-task")
	})

	task('process-manifest', async ({ files }) => {
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

	task('process-main', async ({ config, command }) => {
		if (command === 'dev') {
			const ctx = await esbuild.context(config.esbuild.dev);
			await ctx.watch();
		} else {
			await esbuild.build(config.esbuild.build);
		}
	});

	task('process-ui', async ({ config, command }) => {
		if (command === 'dev') {
			await viteBuild(_.merge({}, config.vite.build, { build: { watch: {} } }));
		} else {
			await viteBuild(config.vite.build);
		}
	});

	task('start-ui-server', async ({ config }) => {
		const server = await createServer(config.vite.dev);
		await server.listen();
	});

	task('dev', async function (context) {

		context.command = 'dev';
		await task.series([
			'process-manifest',
			'build-placeholder-ui',
			'process-main',
			'start-ui-server',
		]);
	});

	task('build', async function (context) {
		context.command = 'build';
		await task.series([
			'process-manifest',
			'process-ui',
			'process-main',
		]);
	});

	task("test", (context) => {
		console.log(context)
		task.series([
			'test-task'
		])
	})
}
