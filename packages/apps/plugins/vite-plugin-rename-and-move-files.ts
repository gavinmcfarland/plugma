import fs from 'fs'
import path from 'path'

// Recursive function to delete a directory and its contents
const deleteDirectoryRecursively = (dirPath: string) => {
	if (fs.existsSync(dirPath)) {
		// Read all files and directories in the current directory
		fs.readdirSync(dirPath).forEach((file) => {
			const curPath = path.join(dirPath, file)
			if (fs.statSync(curPath).isDirectory()) {
				// Recursively delete subdirectories
				deleteDirectoryRecursively(curPath)
			} else {
				// Delete files
				fs.unlinkSync(curPath)
			}
		})
		// Delete the now-empty directory
		fs.rmdirSync(dirPath)
	}
}

export default function renameAndMoveFilesPlugin(newDir?: string) {
	// Declare a variable to store the root directory
	let rootDir = ''

	return {
		name: 'vite-plugin-rename-move-files',

		// Hook into Vite's config to get the project root
		configResolved(config) {
			rootDir = config.root // Store the root directory in a local variable
		},

		// Hook into the Vite build process after files are written to the `dist` folder
		closeBundle() {
			// Resolve the dist folder path based on the root directory
			const distDir = path.resolve(rootDir, 'dist')

			if (newDir) {
				// Resolve the new directory path based on the root directory
				const targetDir = path.resolve(rootDir, newDir)

				// Create the new directory if it doesn't exist
				if (!fs.existsSync(targetDir)) {
					fs.mkdirSync(targetDir, { recursive: true })
				}

				const projects = fs
					.readdirSync(distDir, { withFileTypes: true })
					.filter((dirent) => dirent.isDirectory())
					.map((dirent) => dirent.name)

				projects.forEach((project) => {
					const projectPath = path.join(distDir, project)
					const indexPath = path.join(projectPath, 'index.html')
					const newFilePath = path.join(targetDir, `${project}.html`)

					if (fs.existsSync(indexPath)) {
						// Move and rename the index.html file
						fs.renameSync(indexPath, newFilePath)
						// Remove the now-empty project folder
						deleteDirectoryRecursively(projectPath)
					}
				})
			} else {
				const projects = fs
					.readdirSync(distDir, { withFileTypes: true })
					.filter((dirent) => dirent.isDirectory())
					.map((dirent) => dirent.name)

				projects.forEach((project) => {
					const projectPath = path.join(distDir, project)
					const indexPath = path.join(projectPath, 'index.html')
					const newFilePath = path.join(distDir, `${project}.html`)

					if (fs.existsSync(indexPath)) {
						// Move and rename the index.html file within the same directory
						fs.renameSync(indexPath, newFilePath)
						// Remove the now-empty project folder
						deleteDirectoryRecursively(projectPath)
					}
				})
			}
		},
	}
}
