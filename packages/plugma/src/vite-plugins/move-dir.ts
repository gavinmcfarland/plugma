// vite-plugin-copy-directory.js
import fs from 'fs'
import path from 'path'

function removeDirectory(dirPath: string) {
	if (fs.existsSync(dirPath)) {
		const files = fs.readdirSync(dirPath)

		for (const file of files) {
			const filePath = path.join(dirPath, file)
			if (fs.statSync(filePath).isDirectory()) {
				// Recursively remove subdirectories
				removeDirectory(filePath)
			} else {
				// Remove files
				fs.unlinkSync(filePath)
			}
		}
		fs.rmdirSync(dirPath) // Remove the directory itself
	}
}

function copyDirectory(source: string, destination: string) {
	if (!fs.existsSync(destination)) {
		fs.mkdirSync(destination)
	}

	const files = fs.readdirSync(source)

	for (const file of files) {
		const sourcePath = path.join(source, file)
		const destPath = path.join(destination, file)

		if (fs.statSync(sourcePath).isDirectory()) {
			// Recursively copy subdirectories
			copyDirectory(sourcePath, destPath)
		} else {
			// Check if file is named 'index.html'
			if (file === 'index.html' || file === 'ui.html') {
				// Rename 'index.html' to 'ui.html' during copy
				fs.copyFileSync(sourcePath, path.join(destination, 'ui.html'))
			} else {
				// Copy files other than 'index.html'
				fs.copyFileSync(sourcePath, destPath)
			}
		}
	}

	// Remove all directories within the destination directory
	const subdirs = fs.readdirSync(destination)
	for (const subdir of subdirs) {
		const subdirPath = path.join(destination, subdir)
		if (fs.statSync(subdirPath).isDirectory()) {
			removeDirectory(subdirPath)
		}
	}
}

// This is used because Vite outputs files to same path as the input file. Therefore we need to move the files to a different path after Vite outputs the files to the output directory.

export default function moveDir({ sourceDir, targetDir }: { sourceDir: string; targetDir: string }) {
	return {
		name: 'plugma:move-dir',
		apply: 'build' as const,
		writeBundle() {
			// Only copy if source directory exists

			if (fs.existsSync(sourceDir)) {
				copyDirectory(sourceDir, targetDir)
				// removeDirectory(sourceDir)
			}
		},
	}
}
