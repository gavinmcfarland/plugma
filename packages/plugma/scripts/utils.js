import fs from 'fs';
import path, { dirname, resolve, join } from 'path';
import htmlTransform from '../lib/vite-plugins/vite-plugin-html-transform.js';
import replaceMainInput from '../lib/vite-plugins/vite-plugin-replace-main-input.js';
import deepIndex from '../lib/vite-plugins/vite-plugin-deep-index.js';
import viteCopyDirectoryPlugin from '../lib/vite-plugins/vite-plugin-copy-dir.js';
import dotEnvLoader from '../lib/vite-plugins/vite-plugin-dot-env-loader.js';
import { viteSingleFile } from 'vite-plugin-singlefile';
import os from 'os';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import vitePluginInsertCustomFunctions from '../lib/vite-plugins/vite-plugin-insert-custom-functions.js';
import viteSupressLogs from '../lib/vite-plugins/vite-plugin-surpress-logs.js';


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
			sourceDir: path.join(options.output, 'node_modules', 'plugma', 'tmp'),
			targetDir: path.join(options.output),
		})
	];

	const tempFilePath = writeTempFile(`temp_${Date.now()}.js`, userFiles, options);

	// Vite configuration
	const viteConfig = {

		dev: {
			// publicDir: path.resolve(`${__dirname}/../ public`),
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
				outDir: path.join(options.output),
				emptyOutDir: false,
				rollupOptions: { input: 'node_modules/plugma/tmp/index.html' },
			},
			plugins: [
				replaceMainInput({ pluginName: userFiles.manifest.name, input: userFiles.manifest.ui }),
				...commonVitePlugins
			],
		},
	};

	const bannerCode = fs.readFileSync(`${__dirname}/banner.js`, 'utf8')

	const injectedCode = bannerCode.replace('let runtimeData', `let runtimeData = ${JSON.stringify(options)};`);

	const viteConfigMainBuild = {
		// configFile: false,
		mode: options.mode,
		define: {
			'process.env.NODE_ENV': JSON.stringify(options.mode),
		},
		plugins: [
			dotEnvLoader(options)
		],
		build: {
			lib: {
				entry: tempFilePath, // Entry file for backend code
				formats: ['cjs'],    // Output format, CommonJS for Node.js
			},
			rollupOptions: {
				output: {
					dir: path.join(options.output),               // Output directory
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


	const viteConfigMainDev = {
		// configFile: false,
		mode: options.mode,
		define: {
			'process.env.NODE_ENV': JSON.stringify(options.mode),
		},
		plugins: [
			dotEnvLoader(options),
			vitePluginInsertCustomFunctions({
				codeToPrepend: injectedCode
			})
		],
		// TODO: Make two versions of viteConfigMain one for build and one for dev
		// esbuild: {
		// 	banner: injectedCode,
		// },
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
					dir: `${options.output}`,               // Output directory
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

	// Return both configurations in a config object
	return {
		vite: viteConfig,
		viteMain: {
			dev: viteConfigMainDev,
			build: viteConfigMainBuild
		}
	};
}

function notifyOnRebuild() {
	let isInitialBuild = true;

	return {
		name: 'rebuild-notify',
		setup(build) {
			build.onEnd(() => {
				if (!isInitialBuild) {
					console.log(`${chalk.grey(formatTime())} ${chalk.cyan.bold('[esbuild]')} ${chalk.green('rebuilt')} ${chalk.grey(`/${options.output}/main.js`)}`);
				}
				isInitialBuild = false; // Set to false after the first build
			});
		},
	};
}

function writeTempFile(fileName, userFiles, options) {
	const tempFilePath = join(os.tmpdir(), fileName);
	const bannerCode = fs.readFileSync(`${__dirname}/banner.js`, 'utf8')
	const injectedCode = bannerCode.replace('let runtimeData', `let runtimeData = ${JSON.stringify(options)};`);
	const modifiedContent = `import plugmaMain from "${CURR_DIR}/${userFiles.manifest.main}";
		plugmaMain();`;


	fs.writeFileSync(tempFilePath, modifiedContent);

	return tempFilePath;
}

export function transformObject(input, options) {
	const transformed = JSON.parse(JSON.stringify(input)); // Deep copy the input object

	// Update devAllowedDomains
	transformed.networkAccess.devAllowedDomains = transformed.networkAccess.devAllowedDomains.map(domain => {
		// Replace `*` in either `http://localhost:*` or `https://localhost:*`
		if (domain === "http://localhost:*" || domain === "https://localhost:*") {
			const protocol = domain.startsWith("https") ? "https" : "http";
			return `${protocol}://localhost:${options.port}`;
		}
		return domain;
	});

	return transformed;
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
