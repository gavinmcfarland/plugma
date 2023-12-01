#!/usr/bin/env node

import inquirer from 'inquirer';
import * as fs from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import slugify from '@sindresorhus/slugify'
import createDirectoryContents from './scripts/createDirectoryContents.js';
import { exec } from 'node:child_process'
import lodashTemplate from 'lodash.template'

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));

const CHOICES = fs.readdirSync(`${__dirname}/templates`);

const QUESTIONS = [
	{
		name: 'project-choice',
		type: 'list',
		message: 'What project template would you like to generate?',
		choices: CHOICES,
	},
	{
		name: 'name',
		type: 'input',
		message: 'Project name:',
		validate: function (input) {
			if (/^([A-Za-z\-\\_\d])+$/.test(input)) return true;
			else return 'Project name may only include letters, numbers, underscores and hashes.';
		},
	},
];

function writeIndexFile(projectName, answers) {

	let newIndexPath = `${CURR_DIR}/${projectName}/node_modules/plugma/index.html`;

	let contents = fs.readFileSync(`${__dirname}/index.html`, 'utf8');

	let comptempl = lodashTemplate(contents)

	let input = answers['project-choice'] === "svelte" ? 'svelte/main.ts' : 'vanilla/main.js'

	contents = comptempl({ name: "figma", input })

	// console.log(newIndexPath)

	// Write
	fs.writeFileSync(newIndexPath, contents, 'utf8');
}

inquirer.prompt(QUESTIONS).then(answers => {
	const projectChoice = answers['project-choice'];
	const projectName = slugify(answers['name']);
	const templatePath = `${__dirname}/templates/${projectChoice}`;



	fs.mkdirSync(`${CURR_DIR}/${projectName}`);

	console.log(`Copying "${projectChoice}" template...`)



	createDirectoryContents(templatePath, projectName, answers);

	console.log(`Next:
			cd ${projectName}
			npm install`)


	// const command = `npm install ${__dirname}/../plugma --no-save --no-package-lock`

	// let cwd = `${CURR_DIR}/${slugify(projectName)}`
	// Install dependencies
	// console.log(`Installing dependencies...`)

	// console.log(cwd)
	// exec(command, function (error) {
	// 	console.log(error)
	// 	if (!error) {

	// 	}
	// })

	// fs.cp(`${__dirname}/../plugma`, `${CURR_DIR}/${slugify(projectName)}/node_modules/plugma`, { recursive: true }, (err) => {
	// 	if (err) {
	// 		console.error(err);
	// 	}
	// 	else {
	// 		writeIndexFile(projectName, answers)
	// 		console.log(`Next:
	// 		cd ${projectName}
	// 		npm install`)
	// 	}
	// });



});

