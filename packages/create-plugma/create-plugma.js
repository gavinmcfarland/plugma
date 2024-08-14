#!/usr/bin/env node

import inquirer from 'inquirer';
import * as fs from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import slugify from '@sindresorhus/slugify'
import createDirectoryContents from './scripts/createDirectoryContents.js';
import { exec } from 'node:child_process'
import lodashTemplate from 'lodash.template'
import path from 'path';

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));

const frameworks = [
	{
		name: 'Vanilla',
		variants: [
			{
				name: 'TypeScript',
				dir: 'vanilla-ts'
			},
			{
				name: 'JavaScript',
				dir: 'vanilla'
			}
		]
	},
	{
		name: 'Svelte',
		variants: [
			{
				name: 'TypeScript',
				dir: 'svelte-ts'
			},
			{
				name: 'JavaScript',
				dir: 'svelte'
			}
		]
	},
	{
		name: 'React',
		variants: [
			{
				name: 'TypeScript',
				dir: 'react-ts'
			},
			{
				name: 'JavaScript',
				dir: 'react'
			}
		]
	},
	{
		name: 'Vue',
		variants: [
			{
				name: 'TypeScript',
				dir: 'vue-ts'
			},
			{
				name: 'JavaScript',
				dir: 'vue'
			}
		]
	},
	// {
	// 	name: 'Marko',
	// 	variants: [
	// 		{
	// 			name: 'JavaScript',
	// 			dir: 'marko'
	// 		}
	// 	]
	// }
];

const questions = [
	{
		type: 'list',
		name: 'framework',
		message: 'Select a framework:',
		choices: frameworks.map(f => f.name)
	},
	{
		type: 'list',
		name: 'variant',
		message: 'Select a variant:',
		choices: answers => {
			const framework = frameworks.find(f => f.name === answers.framework);
			return framework.variants.map(v => v.name);
		}
	},
	{
		type: 'input',
		name: 'name',
		message: 'Project name:',
		validate: input => {
			const valid = /^[a-zA-Z0-9_-]+$/.test(input);
			if (!valid) {
				return 'Project name can only include letters, numbers, underscores, and hyphens.';
			}
			const destDir = path.join(process.cwd(), input);
			if (fs.existsSync(destDir)) {
				return `Directory "${input}" already exists. Please choose a different name.`;
			}
			return true;
		}
	},

];

inquirer.prompt(questions).then(answers => {
	const { name, framework, variant } = answers;

	const selectedFramework = frameworks.find(f => f.name === framework);
	const selectedVariant = selectedFramework.variants.find(v => v.name === variant);

	// Define the source and destination directories
	const sourceDir = path.join(__dirname, 'templates', selectedVariant.dir);
	const destDir = path.join(CURR_DIR, name);

	// Copy the selected framework and variant to the destination directory
	// copyDirectory(sourceDir, destDir);

	fs.mkdirSync(`${CURR_DIR}/${name}`);

	// console.log(`Copying "${selectedFramework}" template...`)

	createDirectoryContents(sourceDir, name, answers);

	console.log(`Next:
    cd ${name}
    npm install
    npm run dev`)

});










