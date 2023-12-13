// import inquirer from 'inquirer';
import * as fs from 'fs';
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';
// import slugify from '@sindresorhus/slugify'
// import createDirectoryContents from './scripts/createDirectoryContents.js';
// import { exec } from 'node:child_process'
import lodashTemplate from 'lodash.template'
import { createPrivateKey } from 'crypto';

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Function to copy a directory
function copyDirectory(source, destination) {
	// Create destination directory if it doesn't exist
	if (!fs.existsSync(destination)) {
		fs.mkdirSync(destination);
	}

	// Read the contents of the source directory
	const files = fs.readdirSync(source);

	// Iterate through files and directories
	files.forEach(file => {
		const srcPath = join(source, file);
		const destPath = join(destination, file);

		// Check if the current item is a file or a directory
		if (fs.lstatSync(srcPath).isDirectory()) {
			// Recursively copy directories
			copyDirectory(srcPath, destPath);
		} else {
			// Copy file
			fs.copyFileSync(srcPath, destPath);
		}
	});
}


function createPrivateDir() {
	let pkgPath = resolve(`${process.env.INIT_CWD}/package.json`)

	let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

	if (pkg?.plugma?.framework === "svelte") {
		let sourceDir = resolve(`${process.env.INIT_CWD}/node_modules/plugma/frameworks/svelte`)
		let targetDir = resolve(`${process.env.INIT_CWD}/.plugma`)
		console.log(sourceDir, targetDir)
		copyDirectory(sourceDir, targetDir)
	}
}


export default createPrivateDir


