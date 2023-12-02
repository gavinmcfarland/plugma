// vite-plugin-copy-directory.js
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);
const rmdir = promisify(fs.rmdir);
const unlink = promisify(fs.unlink);
const rename = promisify(fs.rename);

function removeEmptyDirectories(dirPath) {
	const parentDir = path.dirname(dirPath);
	if (fs.existsSync(dirPath)) {
		fs.rmdirSync(dirPath);
	}
	if (fs.existsSync(parentDir) && fs.readdirSync(parentDir).length === 0) {
		removeEmptyDirectories(parentDir);
	}
}

function removeDirectory(dirPath) {
	if (!fs.existsSync(dirPath)) {
		return;
	}

	const files = fs.readdirSync(dirPath);
	files.forEach((file) => {
		const curPath = path.join(dirPath, file);
		if (fs.lstatSync(curPath).isDirectory()) {
			removeDirectory(curPath);
		} else {
			fs.unlinkSync(curPath);
		}
	});

	fs.rmdirSync(dirPath);
	removeEmptyDirectories(dirPath);
}

function copyDirectory(sourceDir, targetDir, newFileName = 'ui.html') {
	const sourcePath = path.resolve(process.cwd(), sourceDir);
	const targetPath = path.resolve(process.cwd(), targetDir);

	const copyFileSync = (source, target) => {
		const targetFile = target;

		if (!fs.existsSync(targetFile)) {
			fs.mkdirSync(targetFile, { recursive: true });
		}

		const files = fs.readdirSync(source);

		files.forEach((file) => {
			const currentSource = path.join(source, file);
			const currentTarget = path.join(targetFile, file);
			if (fs.lstatSync(currentSource).isDirectory()) {
				copyFileSync(currentSource, currentTarget);
			} else {
				fs.copyFileSync(currentSource, currentTarget);
			}
		});
	};

	copyFileSync(sourcePath, targetPath);
	console.log(`Directory copied from ${sourcePath} to ${targetPath}`);

	removeDirectory(sourcePath);
	console.log(`Original directory ${sourcePath} removed.`);

	const filesInTarget = fs.readdirSync(targetPath);
	filesInTarget.forEach((file) => {
		if (file === 'index.html') {
			const oldFilePath = path.join(targetPath, file);
			const newFilePath = path.join(targetPath, newFileName);
			rename(oldFilePath, newFilePath)
				.then(() => console.log(`File ${file} renamed to ${newFileName}`))
				.catch((err) => console.error(`Error renaming file ${file}: ${err}`));
		}
	});
}

export default function viteCopyDirectoryPlugin({ sourceDir, targetDir, newFileName }) {
	return {
		name: 'vite-plugin-copy-dir',
		apply: 'build',
		writeBundle() {
			copyDirectory(sourceDir, targetDir, newFileName);
		},
	};
}
