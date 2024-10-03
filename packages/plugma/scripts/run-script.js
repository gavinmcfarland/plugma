import { createServer, build } from 'vite';
import esbuild from 'esbuild';
import fse from 'fs-extra';
import fs from 'fs';
import path, { dirname, resolve, join } from 'path';
import { exec } from 'child_process';
import os from 'os';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import lodashTemplate from 'lodash.template';
import _ from 'lodash';

import envfilePlugin from '../lib/esbuild-plugins/esbuild-plugin-envfile.js';
import htmlTransform from '../lib/vite-plugins/vite-plugin-html-transform.js';
import replaceMainInput from '../lib/vite-plugins/vite-plugin-replace-main-input.js';
import deepIndex from '../lib/vite-plugins/vite-plugin-deep-index.js';
import viteCopyDirectoryPlugin from '../lib/vite-plugins/vite-plugin-copy-dir.js';
import { viteSingleFile } from 'vite-plugin-singlefile';
import globalPolyfill from '../lib/esbuild-plugins/esbuild-plugin-global-polyfill.js';
import { Log } from '../lib/logger.js';

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);

export default async function cli(command, options) {
	const log = new Log({ debug: options.debug });

	process.env.NODE_ENV = options.mode || 'development';
	options.port = options.port || getRandomNumber();

	const pkg = await readJson(resolve(`${__dirname}/../package.json`));
	const data = await getFiles();

	const viteConfigs = createViteConfigs(options, data);
	const esbuildConfigs = createEsbuildConfigs(options, data);

	switch (command) {
		case 'build':
			await runBuildTask(options, data, viteConfigs.build, pkg, log, esbuildConfigs.build);
			break;

		case 'dev':
			await runDevTask(options, data, viteConfigs.dev, pkg, log, esbuildConfigs);
			break;

		default:
			console.error(`Unknown command: ${command}`);
			process.exit(1);
	}
}

async function runBuildTask(options, data, buildViteConfig, pkg, log, esbuildBuildConfig) {
	log.text(`${chalk.blue.bold('Plugma')} ${chalk.grey("v" + pkg.version)}`);

	await writeIndexFile();
	// Build manifest
	await writeManifestFile(data, () => log.format({ indent: 1 }).text(`manifest.json file created!`));
	// Build main
	await handleEsbuild(esbuildBuildConfig, options, log);
	// Build UI
	await handleViteBuild(buildViteConfig, options.watch, log);
}

async function runDevTask(options, data, devViteConfig, pkg, log, esbuildConfigs) {
	log.text(`${chalk.blue.bold('Plugma')} ${chalk.grey("v" + pkg.version)}`);

	await writeIndexFile();
	// Build manifest
	await writeManifestFile(data, () => log.format({ indent: 1 }).text(`manifest.json file created!`));
	// Build main
	await handleEsbuild(esbuildConfigs.dev, options, log);

	// Build ui
	buildDevUiFile(options, log)
	log.format({ indent: 1 }).text(`ui.html file created!`);

	if (options.websockets) {
		log.format({ indent: 1 }).text(`Preview: ${chalk.cyan(`http://localhost:${options.port}/`)}`);
	}

	log.text(`\nWatching for changes...`);

	await startViteServer(devViteConfig, options.websockets);

}

async function handleEsbuild(esbuildConfig, options, log) {
	try {
		if (options.watch) {
			const ctx = await esbuild.context(esbuildConfig);
			await ctx.watch();
		} else {
			await esbuild.build(esbuildConfig);
			log.format({ indent: 1 }).text(`main.js file created!`);
		}
	} catch (err) {
		console.error('Error bundling file with esbuild:', err);
	}
}

async function handleViteBuild(viteConfig, watch, log) {
	if (watch) {
		await build(_.merge({}, viteConfig, { build: { watch: {} } }));
	} else {
		await build(viteConfig);
	}
	log.format({ indent: 1 }).text(`ui.html file created!`);
}

async function startViteServer(viteConfig, websocketsEnabled) {
	try {
		const server = await createServer(viteConfig);
		await server.listen();

		if (websocketsEnabled) {
			exec('node node_modules/plugma/lib/start-web-sockets-server.cjs');
		}
	} catch (err) {
		console.error('Error starting Vite server:', err);
		process.exit(1);
	}
}

function createViteConfigs(options, data) {
	const commonPlugins = [
		viteSingleFile(),
		viteCopyDirectoryPlugin({
			sourceDir: 'dist/node_modules/plugma/tmp/',
			targetDir: 'dist/',
		}),
	];

	return {
		dev: {
			mode: options.mode,
			define: { 'process.env.NODE_ENV': JSON.stringify(options.mode) },
			plugins: [
				replaceMainInput({ pluginName: data.figmaManifest.name, input: data.figmaManifest.ui }),
				htmlTransform(options),
				deepIndex(),
				...commonPlugins,
			],
			server: { port: options.port },
		},
		build: {
			build: {
				emptyOutDir: false,
				rollupOptions: { input: 'node_modules/plugma/tmp/index.html' },
			},
			plugins: commonPlugins,
		},
	};
}

function createEsbuildConfigs(options, data) {
	const tempFilePath = writeTempFile(`temp_${Date.now()}.js`, data);

	const commonConfig = {
		entryPoints: [tempFilePath],
		outfile: 'dist/main.js',
		format: 'esm',
		bundle: true,
		target: 'es2016',
		plugins: [
			globalPolyfill(),
			envfilePlugin({
				envPath: '.env',
				envTestPath: '.env.test',
				envDevelopmentPath: '.env.development',
			}),
		],
	};

	return {
		dev: {
			...commonConfig,
			inject: [resolve(`${__dirname}/../lib/global-shim.js`)],
			define: {
				'process.env.NODE_ENV': JSON.stringify(options.mode),
				process: JSON.stringify({}),
			},
			plugins: [...commonConfig.plugins, notifyOnRebuild()],
		},
		build: commonConfig,
	};
}

function notifyOnRebuild() {
	return {
		name: 'rebuild-notify',
		setup(build) {
			build.onEnd(() => {
				console.log(`${chalk.grey(formatTime())} ${chalk.cyan.bold('[esbuild]')} ${chalk.green('rebuilt')} ${chalk.grey('/dist/main.js')}`);
			});
		},
	};
}

function formatTime() {
	const currentDate = new Date();
	let hours = currentDate.getHours();
	const minutes = String(currentDate.getMinutes()).padStart(2, '0');
	const seconds = String(currentDate.getSeconds()).padStart(2, '0');
	const meridiem = hours >= 12 ? 'PM' : 'AM';
	hours = hours % 12 || 12;
	return `${hours}:${minutes}:${seconds} ${meridiem}`;
}

async function readJson(filePath) {
	if (fs.existsSync(filePath)) {
		const data = await fs.promises.readFile(filePath, 'utf8');
		return JSON.parse(data);
	}
	return false;
}

function writeTempFile(fileName, data) {
	const tempFilePath = join(os.tmpdir(), fileName);
	const modifiedContent = `import main from "${CURR_DIR}/${data.figmaManifest.main}"; main();`;
	fs.writeFileSync(tempFilePath, modifiedContent);
	return tempFilePath;
}

async function getFiles() {
	const rootManifest = await readJson('./manifest.json');
	const pkg = await readJson(resolve('./package.json'));
	const figmaManifest = rootManifest || pkg.plugma?.manifest;

	if (!pkg.plugma?.manifest?.name && !rootManifest?.name) {
		console.warn(`Plugma: Please specify the name in the manifest. Example: \`{ name: "My Plugin" }\``);
	}

	return { figmaManifest, pkg };
}

async function writeManifestFile(data, callback) {
	const pluginName = data.figmaManifest.name || data.pkg.name;
	const newManifest = {
		...data.figmaManifest,
		name: pluginName,
		api: '1.0.0',
		main: 'main.js',
		ui: 'ui.html',
	};
	await fse.outputFile('./dist/manifest.json', JSON.stringify(newManifest, null, 2));
	if (callback) callback();
}

async function writeIndexFile() {
	const indexTemplatePath = `${__dirname}/../templates/index.html`;
	const newIndexPath = `${__dirname}/../tmp/index.html`;
	const contents = await fs.promises.readFile(indexTemplatePath, 'utf8');
	const pkg = await readJson(resolve(`${CURR_DIR}/package.json`));
	const manifest = await readJson(resolve('./manifest.json')) || pkg.plugma.manifest;

	const input = resolve('/', manifest?.ui || '/src/ui.ts');
	const comptempl = lodashTemplate(contents);
	const finalContent = comptempl({ name: 'figma', input });

	await fse.outputFile(newIndexPath, finalContent);
}

function getRandomNumber() {
	return Math.floor(Math.random() * (6999 - 3000 + 1)) + 3000;
}

function buildDevUiFile(options, log) {
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

	log.format({ indent: 1 }).text(`ui.html file created!`)
}

function createFileWithDirectory(filePath, fileName, fileContent, callback) {

	function callback(err, result) {
		if (err) {
			console.error('Error:', err);
		} else {
			console.log(result);
		}
	}
	// Extract the directory path
	const directoryPath = dirname(resolve(filePath, fileName));

	// Use fs.mkdir to create the directory
	fs.mkdir(directoryPath, { recursive: true }, (err) => {
		if (err) {
			callback(err);
		} else {
			// Write to the file using fs.writeFile
			fs.writeFile(resolve(filePath, fileName), fileContent, 'utf8', (err) => {
				if (err) {
					callback(err);
				} else {
					// callback(null, `${fileName} created successfully!`);
				}
			});
		}
	});
}
