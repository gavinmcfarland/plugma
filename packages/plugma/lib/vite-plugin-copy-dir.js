// vite-plugin-copy-directory.js
import fs from 'fs';
import path from 'path';
// import { promisify } from 'util';

// const copyFile = promisify(fs.copyFile);
// const mkdir = promisify(fs.mkdir);
// const rmdir = promisify(fs.rmdir);
// const unlink = promisify(fs.unlink);
// const rename = promisify(fs.rename);

// function removeEmptyDirectories(dirPath) {
// 	const parentDir = path.dirname(dirPath);
// 	if (fs.existsSync(dirPath)) {
// 		fs.rmdirSync(dirPath);
// 	}
// 	if (fs.existsSync(parentDir) && fs.readdirSync(parentDir).length === 0) {
// 		removeEmptyDirectories(parentDir);
// 	}
// }

// function removeDirectory(dirPath) {
// 	if (!fs.existsSync(dirPath)) {
// 		return;
// 	}

// 	const files = fs.readdirSync(dirPath);
// 	files.forEach((file) => {
// 		const curPath = path.join(dirPath, file);
// 		if (fs.lstatSync(curPath).isDirectory()) {
// 			removeDirectory(curPath);
// 		} else {
// 			fs.unlinkSync(curPath);
// 		}
// 	});

// 	fs.rmdirSync(dirPath);
// 	removeEmptyDirectories(dirPath);
// }

function copyDirectory(source, destination) {
	if (!fs.existsSync(destination)) {
		fs.mkdirSync(destination);
	}

	const files = fs.readdirSync(source);

	for (const file of files) {
		const sourcePath = path.join(source, file);
		const destPath = path.join(destination, file);

		if (fs.statSync(sourcePath).isDirectory()) {
			// Recursively copy subdirectories
			copyDirectory(sourcePath, destPath);
		} else {
			// Copy files
			fs.copyFileSync(sourcePath, destPath);
		}
	}
}

export default function viteCopyDirectoryPlugin({ sourceDir, targetDir }) {
	return {
		name: 'vite-plugin-copy-dir',
		apply: 'build',
		writeBundle() {
			copyDirectory(sourceDir, targetDir);
		},
	};
}
