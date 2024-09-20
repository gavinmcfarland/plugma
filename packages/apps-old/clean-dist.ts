import fs from "fs";
import path from "path";

// Function to get the directory name from import.meta.url
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Recursive function to delete a directory and its contents
const deleteDirectoryRecursively = (dirPath: string) => {
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
const distDir = path.resolve(__dirname, "dist");
if (fs.existsSync(distDir)) {
	deleteDirectoryRecursively(distDir);
}
