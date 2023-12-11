// import inquirer from 'inquirer';
import * as fs from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
// import slugify from '@sindresorhus/slugify'
// import createDirectoryContents from './scripts/createDirectoryContents.js';
// import { exec } from 'node:child_process'
import lodashTemplate from 'lodash.template'

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));



function writeIndexFile() {

	// let newIndexPath = `${CURR_DIR}/${projectName}/node_modules/plugma/index.html`;

	let indexTemplatePath = `${CURR_DIR}/templates/index.html`
	let newIndexPath = `${CURR_DIR}/index.html`

	// Need to use process.env.INIT_CWD because otherwise package is referenced from the module and not the users project
	let pkgPath = resolve(`${process.env.INIT_CWD}/package.json`)

	console.log("package path", pkgPath)

	let contents = fs.readFileSync(indexTemplatePath, 'utf8');
	let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

	let comptempl = lodashTemplate(contents)

	let input = pkg?.plugma?.framework === "svelte" ? 'ui.ts' : 'ui.js'

	contents = comptempl({ name: "figma", input })

	// console.log(contents)


	// Write
	fs.writeFileSync(newIndexPath, contents, 'utf8');
}

writeIndexFile()
