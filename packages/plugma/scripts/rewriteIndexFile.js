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



async function writeIndexFile() {

	// let newIndexPath = `${CURR_DIR}/${projectName}/node_modules/plugma/index.html`;

	let indexTemplatePath = `${CURR_DIR}/templates/index.html`
	let newIndexPath = `${CURR_DIR}/tmp/index.html`

	// Need to use process.env.INIT_CWD because otherwise package is referenced from the module and not the users project
	let pkgPath = resolve(`${process.env.INIT_CWD}/package.json`)

	console.log("package path", pkgPath)

	let contents = fs.readFileSync(indexTemplatePath, 'utf8');
	let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

	let comptempl = lodashTemplate(contents)

	// FIX ME: This is not doing anything at the moment. This should probably happen in the build/dev script instead?
	let input = pkg?.plugma?.framework === "svelte" ? 'ui.ts' : 'ui.ts'

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

writeIndexFile()
// createPrivateDir()
