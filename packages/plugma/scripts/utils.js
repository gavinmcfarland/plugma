import fs from 'fs';
import path, { dirname, resolve, join } from 'path';
import envfilePlugin from '../lib/esbuild-plugins/esbuild-plugin-envfile.js';
import htmlTransform from '../lib/vite-plugins/vite-plugin-html-transform.js';
import replaceMainInput from '../lib/vite-plugins/vite-plugin-replace-main-input.js';
import deepIndex from '../lib/vite-plugins/vite-plugin-deep-index.js';
import viteCopyDirectoryPlugin from '../lib/vite-plugins/vite-plugin-copy-dir.js';
import { viteSingleFile } from 'vite-plugin-singlefile';
import globalPolyfill from '../lib/esbuild-plugins/esbuild-plugin-global-polyfill.js';
import os from 'os';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);

export function createFileWithDirectory(filePath, fileName, fileContent, callback) {

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

export function getRandomNumber() {
	return Math.floor(Math.random() * (6999 - 3000 + 1)) + 3000;
}

export function formatTime() {
	const currentDate = new Date();
	let hours = currentDate.getHours();
	const minutes = String(currentDate.getMinutes()).padStart(2, '0');
	const seconds = String(currentDate.getSeconds()).padStart(2, '0');
	const meridiem = hours >= 12 ? 'PM' : 'AM';
	hours = hours % 12 || 12;
	return `${hours}:${minutes}:${seconds} ${meridiem}`;
}

export async function readJson(filePath) {
	if (fs.existsSync(filePath)) {
		const data = await fs.promises.readFile(filePath, 'utf8');
		return JSON.parse(data);
	}
	return false;
}

export function createConfigs(options, userFiles) {
	// Common plugins and paths for both configurations
	const commonVitePlugins = [
		viteSingleFile(),
		viteCopyDirectoryPlugin({
			sourceDir: 'dist/node_modules/plugma/tmp/',
			targetDir: 'dist/',
		}),
	];

	const tempFilePath = writeTempFile(`temp_${Date.now()}.js`, userFiles);

	const commonEsbuildConfig = {
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

	// Vite configuration
	const viteConfig = {
		dev: {
			mode: options.mode,
			define: { 'process.env.NODE_ENV': JSON.stringify(options.mode) },
			plugins: [
				replaceMainInput({ pluginName: userFiles.manifest.name, input: userFiles.manifest.ui }),
				htmlTransform(options),
				deepIndex(),
				...commonVitePlugins,
			],
			server: { port: options.port },
		},
		build: {
			build: {
				emptyOutDir: false,
				rollupOptions: { input: 'node_modules/plugma/tmp/index.html' },
			},
			plugins: commonVitePlugins,
		},
	};

	// Esbuild configuration
	const esbuildConfig = {
		dev: {
			...commonEsbuildConfig,
			inject: [resolve(`${__dirname}/../lib/global-shim.js`)],
			define: {
				'process.env.NODE_ENV': JSON.stringify(options.mode),
				process: JSON.stringify({}),
			},
			plugins: [...commonEsbuildConfig.plugins, notifyOnRebuild()],
		},
		build: commonEsbuildConfig,
	};

	// Return both configurations in a config object
	return {
		vite: viteConfig,
		esbuild: esbuildConfig,
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

function writeTempFile(fileName, userFiles) {
	const tempFilePath = join(os.tmpdir(), fileName);
	const modifiedContent = `import main from "${CURR_DIR}/${userFiles.manifest.main}"; main();`;
	fs.writeFileSync(tempFilePath, modifiedContent);
	return tempFilePath;
}

export async function writeIndexFile() {
	const indexTemplatePath = `${__dirname}/../templates/index.html`;
	const newIndexPath = `${__dirname}/../tmp/index.html`;
	const contents = await fs.promises.readFile(indexTemplatePath, 'utf8');
	const userPkg = await readJson(resolve(`${CURR_DIR}/package.json`));
	const manifest = await readJson(resolve('./manifest.json')) || userPkg.plugma.manifest;

	const input = resolve('/', manifest?.ui || '/src/ui.ts');
	const comptempl = lodashTemplate(contents);
	const finalContent = comptempl({ name: 'figma', input });

	await fse.outputFile(newIndexPath, finalContent);
}

export async function getUserFiles() {
	const rootManifest = await readJson('./manifest.json');
	const userPkg = await readJson(resolve('./package.json'));
	const manifest = rootManifest || userPkg.plugma?.manifest;

	if (!userPkg.plugma?.manifest?.name && !rootManifest?.name) {
		console.warn(`Plugma: Please specify the name in the manifest. Example: \`{ name: "My Plugin" }\``);
	}

	return { manifest, userPkg };
}
