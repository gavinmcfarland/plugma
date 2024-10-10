import fs from 'fs';
import path, { dirname, resolve, join } from 'path';
import envfilePlugin from '../lib/esbuild-plugins/esbuild-plugin-envfile.js';
import htmlTransform from '../lib/vite-plugins/vite-plugin-html-transform.js';
import replaceMainInput from '../lib/vite-plugins/vite-plugin-replace-main-input.js';
import deepIndex from '../lib/vite-plugins/vite-plugin-deep-index.js';
import viteCopyDirectoryPlugin from '../lib/vite-plugins/vite-plugin-copy-dir.js';
import dotEnvLoader from '../lib/vite-plugins/vite-plugin-dot-env-loader.js';
import { viteSingleFile } from 'vite-plugin-singlefile';
import globalPolyfill from '../lib/esbuild-plugins/esbuild-plugin-global-polyfill.js';
import os from 'os';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { svelte } from "@sveltejs/vite-plugin-svelte";


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
			// configFile: false,
			mode: options.mode,
			define: { 'process.env.NODE_ENV': JSON.stringify(options.mode) },
			plugins: [
				replaceMainInput({ pluginName: userFiles.manifest.name, input: userFiles.manifest.ui }),
				htmlTransform(options),
				deepIndex(),
				...commonVitePlugins,
			],
			server: {
				port: options.port,
				// watch: {
				// 	ignored: ['**/*.env*'],
				// },
			},
		},
		build: {
			// configFile: false,
			build: {
				emptyOutDir: false,
				rollupOptions: { input: 'node_modules/plugma/tmp/index.html' },
			},
			plugins: [
				replaceMainInput({ pluginName: userFiles.manifest.name, input: userFiles.manifest.ui }),
				...commonVitePlugins
			],
		},
	};

	const viteConfigMain = {
		// configFile: false,
		mode: options.mode,
		define: {
			'process.env.NODE_ENV': JSON.stringify(options.mode),
		},
		plugins: [
			dotEnvLoader(options)
		],
		// TODO: Make two versions of viteConfigMain one for build and one for dev
		esbuild: {
			banner: `
            let minimizeWindow = false;
			let pluginWindowSize = {
				width: 300,
				height: 400
			}

// Add the event listener
let runtimeData = ${JSON.stringify(options)};

if (runtimeData.command === "preview") {
	minimizeWindow = true
}

figma.ui.on('message', (message) => {
    // Check if the message type is "PLUGMA_MINIMISE_WINDOW"
    if (message.event === 'PLUGMA_MINIMISE_WINDOW') {
        minimizeWindow = true;
		figma.ui['re' + 'size'](pluginWindowSize.width, 40)
    }
	if (message.event === 'PLUGMA_MAXIMISE_WINDOW') {
        minimizeWindow = false;

		figma.ui['re' + 'size'](pluginWindowSize.width, pluginWindowSize.height + 40)
    }
});

function customResize(width, height) {
	pluginWindowSize = {
		width,
		height
	}
    console.log('Custom resize: ' + width + 'x' + height);

    // Check if the PLUGMA_MINIMIZE_WINDOW event was triggered
    if (minimizeWindow) {
        height = 40;
    }

    // Call the original figma.ui.resize method if it exists
    if (figma && figma.ui && typeof figma.ui.resize === 'function') {
        // To avoid Vite replacing figma.ui.resize and causing an infinite loop
        figma.ui['re' + 'size'](width, height);
    } else {
        console.warn('Figma UI resize method is not available.');
    }
}

function customShowUI(htmlString, options) {

	if (options && options.height) {
		pluginWindowSize.height = options.height
	}

	if (options && options.width) {
		pluginWindowSize.width = options.width
	}


    // Check if the PLUGMA_MINIMIZE_WINDOW event was triggered
    if (minimizeWindow) {
        // Check if the options object exists and if it has a height property
        if (options && options.height) {
            // Override the height property
            options.height = 40; // Set your desired height value here
        }
    }

    console.log('Custom show UI', options);

    if (figma && figma.showUI && typeof figma.showUI === 'function') {
        figma['show' + 'UI'](htmlString, options);
    } else {
        console.warn('Figma showUI method is not available.');
    }
}
        `
		},
		define: {
			// Replace the global usage of `figma.ui.resize` with the function from globalManager
			'figma.ui.resize': 'customResize',
			'figma.showUI': 'customShowUI'
		},
		build: {
			lib: {
				entry: tempFilePath, // Entry file for backend code
				formats: ['cjs'],    // Output format, CommonJS for Node.js
			},
			rollupOptions: {
				output: {
					dir: 'dist',               // Output directory
					entryFileNames: 'main.js', // Name of the output file
					inlineDynamicImports: true, // Inline all imports into one file
				},
			},
			resolve: {
				extensions: ['.ts', '.js'],  // Resolve TypeScript and JavaScript files
			},
			target: 'chrome58',
			sourcemap: false,  // Set to true if you want source maps
			emptyOutDir: false,
		},
	}

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
		viteMain: viteConfigMain,
		esbuild: esbuildConfig,
	};
}

function notifyOnRebuild() {
	let isInitialBuild = true;

	return {
		name: 'rebuild-notify',
		setup(build) {
			build.onEnd(() => {
				if (!isInitialBuild) {
					console.log(`${chalk.grey(formatTime())} ${chalk.cyan.bold('[esbuild]')} ${chalk.green('rebuilt')} ${chalk.grey('/dist/main.js')}`);
				}
				isInitialBuild = false; // Set to false after the first build
			});
		},
	};
}

function writeTempFile(fileName, userFiles) {
	const tempFilePath = join(os.tmpdir(), fileName);
	const modifiedContent = `import main from "${CURR_DIR}/${userFiles.manifest.main}";
	import { mainListeners } from "${CURR_DIR}/node_modules/plugma/lib/mainListeners.js";
	main();
	mainListeners();`;
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
