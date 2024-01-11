import { createServer } from 'vite';
import esbuild from 'esbuild';
import { exec } from 'child_process';
import { dirname, resolve, parse, join } from 'path';
import fs from 'fs';
import os from 'os';
import chalk from 'chalk';
import { build } from 'vite'

const CURR_DIR = process.cwd();

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
		fs.readFile(filePath, 'utf8', function (err, data) {
			if (err) {
				reject(err);
			}
			// console.log(data)
			resolve(JSON.parse(data));
		});
	});
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

		// Create a temporary file and inject code that replaces html string for local dev server
		// const originalContent = fs.readFileSync(data.figmaManifest.main, 'utf8');

		// Create a temporary file path
		// const tempFilePath = join(os.tmpdir(), `temp_${Date.now()}.js`);


		// if (NODE_ENV === "development") {

		// 	const modifiedContent = `import { __html__ } from "plugma/frameworks/common/main/interceptHtmlString";
		// 	import main from "./${data.figmaManifest.main}";
		// 	main();`;
		// 	fs.writeFileSync(tempFilePath, modifiedContent);
		// }
		// else {
		// 	fs.writeFileSync(tempFilePath, originalContent);
		// }

		function writeTempFile(fileName) {
			const tempFilePath = join(os.tmpdir(), fileName);
			const modifiedContent = `import { __html__ } from "${CURR_DIR}/node_modules/plugma/frameworks/common/main/interceptHtmlString";
			import main from "${CURR_DIR}/${data.figmaManifest.main}";
			main();`;
			fs.writeFileSync(tempFilePath, modifiedContent);
			return tempFilePath
		}


		if (NODE_ENV === "development") {
			const fileName = `temp_${Date.now()}.js`
			let tempFilePath = writeTempFile(fileName)

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
							console.log(`main.ts built with ${result.errors.length} errors`);
							// HERE: somehow restart the server from here, e.g., by sending a signal that you trap and react to inside the server.
							// await fs.unlink(tempFilePath, (err => {
							// 	if (err) console.log(err);
							// }));
						})
					},
				}],
			});
			await ctx.watch();



		} else {
			// Fix me, needs to output js file
			// Bundle your .mjs file using esbuild
			await esbuild.build({
				entryPoints: [data.figmaManifest.main],
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


		// // Run your additional Node.js script
		// const childProcess = exec('node node_modules/plugma/lib/server-old.cjs');
		// childProcess.stdout.on('data', (data) => {
		// 	// console.log(`Script output: ${data}`);
		// });
		// childProcess.stderr.on('data', (data) => {
		// 	console.error(`Script error: ${data}`);
		// });
	} catch (err) {
		console.error('Error starting Vite server:', err);
		process.exit(1);
	}
}

async function buildVite(data, callback) {


	if (callback && typeof (callback) === "function") {
		callback();
	}

	// Surpress console logs created by vite
	const originalConsoleLog = console.log;
	console.log = function () { };
	// {
	// 	root: path.resolve(__dirname, './project'),
	// 	base: '/foo/',
	// 	build: {
	// 	  rollupOptions: {
	// 		// ...
	// 	  },
	// 	},
	//   }
	await build()

	console.log = originalConsoleLog;
}

async function getFiles() {
	let pkg = await getJsonFile(resolve('./package.json'));
	let figmaManifest = pkg["figma-manifest"];

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
	return await createFileWithDirectory("./dist", "manifest.json", JSON.stringify({
		"name": `${data.pkg.name}`,
		"id": "<%- id %>",
		"api": "1.0.0",
		"main": "main.js",
		"ui": "ui.html",
		"editorType": ["figma", "figjam"],
		"networkAccess": {
			"allowedDomains": ["*"],
			"reasoning": "Internet access for local development."
		}
	}, null, 2))
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
			await buildVite(data, () => {
				console.log(`  ui.html file created!`)
			})
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

			await buildVite(data, () => {
				console.log(`  ui.html file created!`)
			})
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




		});
	}

}



