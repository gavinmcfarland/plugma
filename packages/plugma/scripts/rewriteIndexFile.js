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

	let indexTemplatePath = `${CURR_DIR}/index.html`

	let contents = fs.readFileSync(indexTemplatePath, 'utf8');
	// let pkg = fs.readFileSync(`${CURR_DIR}/package.json`, 'utf8');

	let comptempl = lodashTemplate(contents)

	let input = "svelte" === "svelte" ? 'svelte/main.ts' : 'vanilla/main.js'

	contents = comptempl({ name: "figma", input })

	console.log(contents)


	// Write
	fs.writeFileSync(indexTemplatePath, contents, 'utf8');
}

writeIndexFile()
