#!/usr/bin/env node

import inquirer from 'inquirer';
import * as fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import slugify from '@sindresorhus/slugify'
import createDirectoryContents from './scripts/createDirectoryContents.js';
import { exec } from 'node:child_process'

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

inquirer.prompt(QUESTIONS).then(answers => {
	const projectChoice = answers['project-choice'];
	const projectName = slugify(answers['name']);
	const templatePath = `${__dirname}/templates/${projectChoice}`;

	fs.mkdirSync(`${CURR_DIR}/${projectName}`);

	console.log(`Copying "${projectChoice}" template...`)
	createDirectoryContents(templatePath, projectName, answers);

	// Install dependencies
	console.log(`Installing dependencies...`)

	console.log(`Next:
	cd ${projectName}
	npm install`)
	const command = 'npm install'
	let cwd = process.cwd()
	exec(command, { cwd }, function (error) {
		// if (error) {
		// 	reject(error)
		// 	return
		// }
	})
});
