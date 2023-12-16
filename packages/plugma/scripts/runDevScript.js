import { createServer } from 'vite';
import esbuild from 'esbuild';
import { exec } from 'child_process';
import { dirname, resolve, parse, join } from 'path';
import fs from 'fs';

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

async function bundleMainWithEsbuild(data) {

	try {

		// Fix me, needs to output js file
		// Bundle your .mjs file using esbuild
		await esbuild.build({
			entryPoints: [`${data.figmaManifest.main}`],
			outfile: `dist/main.js`,
			format: 'esm',
			bundle: true,
		});

		console.log('Main bundled successfully with esbuild!');
	} catch (err) {
		console.error('Error bundling file with esbuild:', err);
	}
}

async function startViteServer(data) {
	try {
		// Create Vite server
		const server = await createServer({
			// Rewrite index html file
			plugins: [
				{
					name: 'html-transform-1',
					transformIndexHtml(html) {
						return html.replace('id="entry" src="(.+?)"', `src="${data.figmaManifest.ui}"`);
					},
				},
			],
			server: { port: 3000 }, // Specify the port you want to use
		});

		await server.listen(); // Start the Vite server
		console.log('Vite UI server is running on http://localhost:3000');

		// Run your additional Node.js script
		const childProcess = exec('node node_modules/plugma/lib/server-old.cjs');
		childProcess.stdout.on('data', (data) => {
			console.log(`Script output: ${data}`);
		});
		childProcess.stderr.on('data', (data) => {
			console.error(`Script error: ${data}`);
		});
	} catch (err) {
		console.error('Error starting Vite server:', err);
		process.exit(1);
	}
}

async function getFiles() {
	let pkg = await getJsonFile(resolve('./package.json'));
	let figmaManifest = pkg["figma-manifest"];

	return {
		figmaManifest,
		pkg
	}
}

function createJSONFile(directory, filename, data) {
	const filePath = join(directory, filename);
	const jsonData = JSON.stringify(data, null, 2); // Convert data to JSON string with indentation

	fs.writeFile(filePath, jsonData, 'utf8', (err) => {


		if (err) {
			console.error('Error creating JSON file:', err);
		} else {
			console.log(`JSON file ${filePath} has been created successfully!`);
		}
	});
}

// Bundle the file and start the server

getFiles().then(async (data) => {
	await createJSONFile("./dist", "manifest.json", {
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
	})
	await bundleMainWithEsbuild(data)
	await startViteServer(data)
});


