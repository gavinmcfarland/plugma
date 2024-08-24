import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.resolve(__dirname, 'lib');
const distDir = path.resolve(__dirname, 'dist'); // Adjust if your dist directory is elsewhere

const runCommand = (command) => {
	try {
		execSync(command, { stdio: 'inherit' });
	} catch (error) {
		console.error(`Error executing command: ${command}`);
		process.exit(1);
	}
};

// Function to delete a directory and its contents recursively
const deleteDirectoryRecursively = (dirPath) => {
	if (fs.existsSync(dirPath)) {
		fs.readdirSync(dirPath).forEach((file) => {
			const curPath = path.join(dirPath, file);
			if (fs.statSync(curPath).isDirectory()) {
				// Recursively delete subdirectories
				deleteDirectoryRecursively(curPath);
			} else {
				// Delete files
				fs.unlinkSync(curPath);
			}
		});
		// Delete the now-empty directory
		fs.rmdirSync(dirPath);
	}
};

// Clean the dist directory
const cleanDist = () => {
	if (fs.existsSync(distDir)) {
		deleteDirectoryRecursively(distDir);
	}
};

// Build all applications
const buildApplications = () => {
	const folders = fs.readdirSync(baseDir, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);

	// Clean the dist directory before building
	cleanDist();

	folders.forEach(folder => {
		console.log(`Building ${folder}...`);
		runCommand(`vite build --mode ${folder}`);
	});
};

buildApplications();
