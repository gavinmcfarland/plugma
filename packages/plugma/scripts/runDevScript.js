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

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));

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
			const modifiedContent = `import { saveFigmaStyles } from "${CURR_DIR}/node_modules/plugma/frameworks/common/main/saveFigmaStyles";
			import main from "${CURR_DIR}/${data.figmaManifest.main}";
			saveFigmaStyles();
			main();`;
			const modifiedContent2 = `import main from "${CURR_DIR}/${data.figmaManifest.main}";
			main();`;
			if (NODE_ENV === "development") {
				fs.writeFileSync(tempFilePath, modifiedContent);
			}
			else {
				fs.writeFileSync(tempFilePath, modifiedContent2);
			}
			return tempFilePath
		}

		const fileName = `temp_${Date.now()}.js`
		let tempFilePath = writeTempFile(fileName)


		if (NODE_ENV === "development") {


			let ctx = await esbuild.context({
				entryPoints: [tempFilePath],
				outfile: `dist/main.js`,
				format: 'esm',
				bundle: true,
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
		const originalConsoleLog = console.log;
		console.log = function () { };

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
			],
			server: { port: options.port }, // Specify the port you want to use
		});

		await server.listen(); // Start the Vite server

		console.log = originalConsoleLog


		// Run a web socket server so postMessage works between browser and Figma. And so Figma theme works in browser
		const childProcess = exec('node node_modules/plugma/lib/server-old.cjs');
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
	const originalConsoleLog = console.log;

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
	console.log({ options })
	if (NODE_ENV === "development") {


		// We don't need to bundle the UI because when developing it needs to point to the dev server. So instead we create a placeholder ui file that points to a server
		let devHtmlString = fs.readFileSync(`${__dirname}/../frameworks/common/main/devHtmlString.html`, 'utf8');



		// FIX ME: Need to replace the port number
		devHtmlString = devHtmlString.replace("5173", `${options.port}`)

		createFileWithDirectory(`${CURR_DIR}/dist`, 'ui.html', devHtmlString)
		// await build()
	}
	else {
		// console.log = function () { };
		await build()
	}


	console.log = originalConsoleLog;
}

async function getFiles() {
	let pkg = await getJsonFile(resolve('./package.json'));
	let figmaManifest = await getJsonFile(resolve('./manifest.json')) || pkg["plugma"]["manifest"];

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

	let newManifest = {
		...data.figmaManifest, ...{
			"name": `${data.pkg.name}`,
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

// Bundle the file and start the server

export default function cli(options) {

	options.port = options.port || 3000

	if (options._[0] === "build") {
		// 1. Create dist folder
		// 1. Create manifest file
		// 2. Create code.js file
		// 3. Create ui.html file
		getFiles().then(async (data) => {

			await writeIndexFile()

			// console.log(viteConfig)
			await buildUI(data, () => {
				console.log(`  ui.html file created!`)
			}, "production", options)
			await writeManifestFile(data, () => {
				console.log(`  manifest.json file created!`)
			})
			await bundleMainWithEsbuild(data, true, () => {
				console.log(`  main.js file created!`)
			}, 'production')

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
  ${chalk.blue.bold('Plugma')} ${chalk.grey('v0.0.1')}

  ➜  Preview: ${chalk.cyan('http://localhost:')}${chalk.bold.cyan(options.port)}${chalk.cyan('/')}
  `);

			await startViteServer(data, options)

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


