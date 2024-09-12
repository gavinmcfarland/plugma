// import inquirer from 'inquirer';
import * as fs from 'fs';
import fse from 'fs-extra';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
// import slugify from '@sindresorhus/slugify'
// import createDirectoryContents from './scripts/createDirectoryContents.js';
// import { exec } from 'node:child_process'
import lodashTemplate from 'lodash.template'
import createPrivateDir from './createPrivateDir.js';

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));


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


async function writeIndexFile() {

	// let newIndexPath = `${CURR_DIR}/${projectName}/node_modules/plugma/index.html`;

	let indexTemplatePath = `${__dirname}/../templates/appTemplateString.html`
	let newIndexPath = `${__dirname}/../tmp/index.html`

	// Need to use process.env.INIT_CWD because otherwise package is referenced from the module and not the users project <- not sure this is true
	let pkgPath = resolve(`${CURR_DIR}/package.json`)

	let contents = fs.readFileSync(indexTemplatePath, 'utf8');
	let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

	let comptempl = lodashTemplate(contents)


	// let input = pkg?.plugma?.framework === "svelte" ? '/src/ui.ts' : '/src/ui.ts'

	let manifest = await getJsonFile(resolve('./manifest.json')) || pkg["plugma"]["manifest"];

	let input = resolve("/", manifest?.ui) || "/src/ui.ts"

	if (getJsonFile(resolve('./manifest.json')))

		contents = comptempl({ name: "figma", input })

	// console.log(contents)


	// Write
	// fs.writeFileSync(newIndexPath, contents, 'utf8');

	function writeToOrCreateFile(filePath, data) {
		// Try to write to the file
		fs.writeFile(filePath, data, (err) => {
			if (err) {
				// If the file doesn't exist, create it and write data
				if (err.code === 'ENOENT') {
					fs.writeFile(filePath, data, (createErr) => {
						if (createErr) {
							console.error('Error creating file:', createErr);
						} else {
							console.log(`File ${filePath} created with data: ${data}`);
						}
					});
				} else {
					console.error('Error writing to file:', err);
				}
			} else {
				console.log(`File ${filePath} replaced with data: ${data}`);
			}
		});
	}

	await fse.outputFile(newIndexPath, contents);
}

export default writeIndexFile
// writeIndexFile()
// createPrivateDir()
