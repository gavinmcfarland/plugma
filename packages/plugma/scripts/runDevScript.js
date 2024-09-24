import { createServer } from 'vite';
import esbuild from 'esbuild';
import { exec } from 'child_process';
import { dirname, resolve, parse, join } from 'path';
import fs from 'fs';
import os, { type } from 'os';
import chalk from 'chalk';
import { build } from 'vite'
import { replace } from 'esbuild-plugin-replace';
import { fileURLToPath } from 'url';
import nodeCleanup from 'node-cleanup';
import lodashTemplate from 'lodash.template'
import writeIndexFile from './rewriteIndexFile.js'
import * as cheerio from 'cheerio';
import pretty from 'pretty';
import ejs from 'ejs';
// import { renderTemplate } from './nunchucksTemplate.js'
import { renderTemplate } from './ejsTemplate.js'
import { wisp } from 'wisp'

import path from 'path'
// import { option } from 'yargs';

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);



const files = {
	devToolbarFile: fs.readFileSync(resolve(`${__dirname}/../frameworks/common/main/devToolbar.html`), 'utf-8')
}

var root

if (process.env.PWD.endsWith("bin")) {
	if (process.env.PWD.endsWith(".bin")) {

		root = resolve(process.env.PWD + "/../..")
	}
	else {
		root = resolve(process.env.PWD + "/../../..")
	}

}
else {
	root = process.cwd()
}

async function getJsonFile(filePath) {
	// var array = [
	//     resolve(root, `manifest.json`),
	//     resolve(root, 'public', 'manifest.json')
	// ]

	// var pathToManifest;

	// if (fs.existsSync(array[0])) {
	//     pathToManifest = array[0]
	// }
	// else if (fs.existsSync(array[1])) {
	//     pathToManifest = array[1]
	// }

	return new Promise((resolve, reject) => {
		if (fs.existsSync(filePath)) {
			fs.readFile(filePath, 'utf8', function (err, data) {
				if (err) {
					reject(err);
				}
				// console.log(data)
				resolve(JSON.parse(data));
			});
		}
		else {
			resolve(false)
		}

	});
}

function formatTime() {
	var currentDate = new Date();
	var hours = currentDate.getHours();
	var minutes = currentDate.getMinutes();
	var seconds = currentDate.getSeconds();
	var meridiem = hours >= 12 ? 'PM' : 'AM';

	// Convert 24-hour format to 12-hour format
	hours = hours % 12;
	hours = hours ? hours : 12; // Handle midnight (12 AM)

	// Add leading zeros to minutes and seconds if needed
	minutes = minutes < 10 ? '0' + minutes : minutes;
	seconds = seconds < 10 ? '0' + seconds : seconds;

	// Concatenate the formatted time
	var formattedTime = hours + ':' + minutes + ':' + seconds + ' ' + meridiem;

	return formattedTime;
}

async function getManifest() {
	var array = [
		resolve(root, `manifest.json`),
		resolve(root, 'public', 'manifest.json')
	]

	var pathToManifest;

	if (fs.existsSync(array[0])) {
		pathToManifest = array[0]
	}
	else if (fs.existsSync(array[1])) {
		pathToManifest = array[1]
	}

	return new Promise((resolve, reject) => {
		fs.readFile(pathToManifest, 'utf8', function (err, data) {
			if (err) {
				reject(err);
			}

			resolve(JSON.parse(data));
		});
	});
}

async function bundleMainWithEsbuild(data, shouldWatch, callback, NODE_ENV) {

	if (callback && typeof (callback) === "function") {
		callback();
	}

	try {

		function writeTempFile(fileName) {
			const tempFilePath = join(os.tmpdir(), fileName);
			const modifiedContent = `import main from "${CURR_DIR}/${data.figmaManifest.main}";
			main();`
			// if (NODE_ENV === "development") {
			fs.writeFileSync(tempFilePath, modifiedContent);
			// }
			return tempFilePath
		}

		const fileName = `temp_${Date.now()}.js`
		let tempFilePath = writeTempFile(fileName)


		if (NODE_ENV === "development" || shouldWatch) {


			let ctx = await esbuild.context({
				entryPoints: [tempFilePath],
				outfile: `dist/main.js`,
				format: 'esm',
				bundle: true,
				target: 'es2016',
				plugins: [{
					name: 'rebuild-notify',
					setup(build) {
						// build.onLoad({ filter: /\.txt$/ }, async (args) => {
						// 	let text = await fs.promises.readFile(args.path, 'utf8')
						// 	return {
						// 		contents: JSON.stringify(text.split(/\s+/)),
						// 		loader: 'json',
						// 	}
						// })
						// build.onStart(() => {
						// 	tempFilePath = writeTempFile(fileName)
						// 	console.log('build started')
						// })
						// build.onStart(() => {
						// 	console.log('Rebuilding...');
						// });
						build.onEnd(async result => {
							console.log(`${chalk.grey(formatTime())} ${chalk.cyan.bold('[esbuild]')} ${chalk.green('rebuilt')} ${chalk.grey('/dist/main.js')}`)
							// console.log(`main.ts built with ${result.errors.length} errors`);
							// HERE: somehow restart the server from here, e.g., by sending a signal that you trap and react to inside the server.
							// await fs.unlink(tempFilePath, (err => {
							// 	if (err) console.log(err);
							// }));
						})
					}
					,
				},
				replace({
					'__buildVersion': '"1.0.0"',
				})
				],
			});
			await ctx.watch();



		} else {
			// Fix me, needs to output js file
			// Bundle your .mjs file using esbuild
			await esbuild.build({
				entryPoints: [tempFilePath],
				outfile: `dist/main.js`,
				format: 'esm',
				bundle: true,
				target: 'es2016',
				define: {
					'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
				},
			});
		}



		// console.log('Main bundled successfully with esbuild!');
	} catch (err) {
		console.error('Error bundling file with esbuild:', err);
	}
}

async function startViteServer(data, options) {

	try {

		// Surpress console logs created by vite
		// const originalConsoleLog = console.log;
		// console.log = function () { };

		// Create Vite server


		const server = await createServer({
			// Rewrite index html file to point to ui file specified in manifest
			plugins: [
				{
					name: 'html-transform-1',
					transformIndexHtml(html) {
						return html.replace('id="entry" src="(.+?)"', `src="${data.figmaManifest.ui}"`);
					},
				},
				{
					// Insert catchFigmaStyles and startWebSocketServer
					name: 'html-transform',
					transformIndexHtml(html) {

						// Can't use template with ejs template directly, so we have to add our file to it first
						let viteAppProxyDev = fs.readFileSync(path.join(__dirname, '../../apps/dist/ViteApp.html'), 'utf8')

						let runtimeData = `<script>
	// Global variables defined on the window object
	window.runtimeData = {
		port: ${options.port}
	};
</script>`

						viteAppProxyDev = viteAppProxyDev.replace(/^/, runtimeData)

						// Apply Vite App scripts n stuff
						html = html.replace('<body>', `<body>${viteAppProxyDev}`)

						// // Add app div and script to bottom
						// html = html.replace('id="entry" src="/main.js"', `src="${data.figmaManifest.ui}"`);


						// if (options._[0] === "dev" && options.toolbar) {

						// 	html = html.replace('<body>', `<body>${files.devToolbarFile}`)
						// }

						return html;
					},
					apply: 'serve'
				},
				{
					// Point / to index.html
					name: "deep-index",
					configureServer(server) {
						server.middlewares.use((req, res, next) => {
							if (req.url === "/") {
								req.url = "/node_modules/plugma/tmp/index.html";
							}
							next();
						});
					},
				},
			],
			// server: {
			// 	port: options.port,
			// 	host: 'localhost',
			// 	cors: {
			// 		origin: '*', // Specify the allowed origin, can be '*' or a specific domain
			// 		credentials: true,
			// 	}
			// } // Specify the port you want to use

			// configureServer: (server) => {
			// 	server.middlewares.use((req, res, next) => {
			// 		res.setHeader('Access-Control-Allow-Private-Network', true);
			// 		next(); // Continue to the next middleware or request handler
			// 	});
			// },
			server: {
				port: options.port,
				logLevel: 'silent'
			}
		});

		// server.middlewares.use((req, res, next) => {
		// 	res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust according to your security requirements
		// 	res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
		// 	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		// 	res.setHeader('Access-Control-Allow-Credentials', 'true');
		// 	res.setHeader('Access-Control-Allow-Private-Network', 'true'); // Enable access to private network

		// 	// Handle preflight requests (OPTIONS requests)
		// 	if (req.method === 'OPTIONS') {
		// 		res.statusCode = 204; // No Content
		// 		res.end();
		// 	} else {
		// 		next(); // Proceed to the next middleware
		// 	}
		// });

		await server.listen(); // Start the Vite server

		// console.log = originalConsoleLog


		// Run a web socket server so postMessage works between browser and Figma. And so Figma theme works in browser
		const childProcess = exec('node node_modules/plugma/lib/startWebSocketsServer.cjs');
		// childProcess.stderr.on('data', (data) => {
		// 	console.error(`Script error: ${data}`);
		// });

		return server


	} catch (err) {
		console.error('Error starting Vite server:', err);
		process.exit(1);
	}


}

async function buildUI(data, callback, NODE_ENV, options) {


	if (callback && typeof (callback) === "function") {
		callback();
	}

	// Surpress console logs created by vite
	// const originalConsoleLog = console.log;
	// console.log = function () { };

	// {
	// 	root: path.resolve(__dirname, './project'),
	// 	base: '/foo/',
	// 	build: {
	// 	  rollupOptions: {
	// 		// ...
	// 	  },
	// 	},
	//   }

	// TODO: Add option/flag here

	// if (options.port) {


	if (options._[0] === 'build') {

		if (options.watch) {
			await build({
				build: {
					watch: {},
					emptyOutDir: false,
				}
			})
		}
		else {
			await build()
		}

	}


	if (options._[0] === 'dev') {
		// We don't need to bundle the UI because when developing it needs to point to the dev server. So instead we create a placeholder ui file that points to a server


		let devHtmlString = fs.readFileSync(`${__dirname}/../../apps/dist/PluginWindow.html`, 'utf8');

		let runtimeData = `<script>
	// Global variables defined on the window object
	window.runtimeData = {
		port: ${options.port}
	};
</script>`

		devHtmlString = devHtmlString.replace(/^/, runtimeData)

		// // Replace the port number in the template
		// devHtmlString = devHtmlString.replace("5173", `${options.port}`)

		createFileWithDirectory(`${CURR_DIR}/dist`, 'ui.html', devHtmlString)
	}

	// console.log = originalConsoleLog;
}

async function getFiles() {


	let rootManifest = await getJsonFile(`./manifest.json`)
	let pkg = await getJsonFile(resolve(`./package.json`));
	let figmaManifest = rootManifest || pkg.plugma?.manifest;




	// Check if name missing from manifest in package or package.json
	if (!pkg.plugma?.manifest?.name && !rootManifest?.name) {
		console.warn(`Plugma: Using package name as plugin name will be depreciated. Please specify the name in the manifest.

Example: \`{ name: "My Plugin" }\``)
	}

	return {
		figmaManifest,
		pkg
	}
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

async function writeManifestFile(data, callback) {
	if (callback && typeof (callback) === "function") {
		callback();
	}

	let pluginName = data.figmaManifest.name ? data.figmaManifest.name : data.pkg.name

	let newManifest = {
		...data.figmaManifest, ...{
			"name": `${pluginName}`,
			"api": "1.0.0",
			"main": "main.js",
			"ui": "ui.html",
		}
	}

	return await createFileWithDirectory("./dist", "manifest.json", JSON.stringify(newManifest, null, 2))
}

// function createJSONFile(directory, filename, data) {
// 	const filePath = join(directory, filename);
// 	const jsonData = JSON.stringify(data, null, 2); // Convert data to JSON string with indentation

// 	fs.writeFile(filePath, jsonData, 'utf8', (err) => {


// 		if (err) {
// 			console.error('Error creating JSON file:', err);
// 		} else {
// 			console.log(`JSON file ${filePath} has been created successfully!`);
// 		}
// 	});
// }

function getRandomNumber() {
	const min = 3000;
	const max = 6999;
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Bundle the file and start the server


export default function cli(options) {

	options.port = options.port || getRandomNumber()

	if (options._[0] === "build") {
		// 1. Create dist folder
		// 1. Create manifest file
		// 2. Create code.js file
		// 3. Create ui.html file
		getFiles().then(async (data) => {

			console.log(`
${chalk.blue.bold('Plugma')} ${chalk.grey("0.0.30")}
`);

			await writeIndexFile()

			// console.log(viteConfig)


			await writeManifestFile(data, () => {
				console.log(`  manifest.json file created!`)
			})
			await bundleMainWithEsbuild(data, options.watch, () => {
				console.log(`  main.js file created!`)
			}, 'production')

			console.log(`
Watching for changes...`)



			if (options.watch) {
				await build({
					build: {
						watch: {},
						emptyOutDir: false,
					}
				})
			}
			else {
				await build({
					build: {
						emptyOutDir: false,
					}
				})
			}



		});
	}

	if (options._[0] === "dev") {

		// 1. Create dist folder
		// 1. Create manifest file
		// 2. Create code.js file
		// 3. Create ui.html file
		// ➜  Local:   http://localhost:5179/
		// ➜  Network: use --host to expose


		getFiles().then(async (data) => {

			console.log(`
${chalk.blue.bold('Plugma')} ${chalk.grey('v0.0.1')}
`);

			await writeIndexFile()

			await buildUI(data, () => {
				console.log(`  ui.html file created!`)
			}, "development", options)
			await writeManifestFile(data, () => {
				console.log(`  manifest.json file created!`)
			})
			await bundleMainWithEsbuild(data, true, () => {
				console.log(`  main.js file created!`)
			}, 'development')





			console.log(`
  ➜  Preview: ${chalk.cyan('http://localhost:')}${chalk.bold.cyan(options.port)}${chalk.cyan('/')}`)



			await startViteServer(data, options)

			console.log(`
Watching for changes...`)

			// async function exitHandler(evtOrExitCodeOrError) {
			// 	try {
			// 		await build()
			// 		// await async code here
			// 		// Optionally: Handle evtOrExitCodeOrError here
			// 	} catch (e) {
			// 		console.error('EXIT HANDLER ERROR', e);
			// 	}

			// 	process.exit(isNaN(+evtOrExitCodeOrError) ? 1 : +evtOrExitCodeOrError);
			// }

			// [
			// 	'beforeExit', 'uncaughtException', 'unhandledRejection',
			// 	'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP',
			// 	'SIGABRT', 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV',
			// 	'SIGUSR2', 'SIGTERM',
			// ].forEach(evt => process.on(evt, exitHandler));


		});
	}

}


