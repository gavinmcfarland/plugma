import fs from "fs";
import path from "path";
import { Plugin } from "vite";

// Function to get the directory name from import.meta.url
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Function to replace id="app" with id="[appFolderName]" in index.html
const replaceIdInHtml = (filePath: string, newId: string) => {
  const content = fs.readFileSync(filePath, "utf-8");
  const newContent = content.replace(/id="app"/g, `id="${newId}"`);
  fs.writeFileSync(filePath, newContent);
};

// Vite plugin to replace id="app" and move modified files
export default function replaceIdPlugin(): Plugin {
  return {
    name: "vite-plugin-replace-id",

    // Hook into the build process
    closeBundle() {
      const distDir = path.resolve(__dirname, "dist");
      const tmpDir = path.resolve(__dirname, "tmp");

      // Ensure the tmp directory exists
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir);
      }

      // Get list of projects (folders) in the dist directory
      const projects = fs
        .readdirSync(distDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      projects.forEach((project) => {
        const projectDistPath = path.join(distDir, project);
        const indexPath = path.join(projectDistPath, "index.html");
        const tmpIndexPath = path.join(tmpDir, `${project}.html`);

        // Ensure the index.html file exists
        if (fs.existsSync(indexPath)) {
          // Replace id="app" with id="[project]" and write to the tmp directory
          replaceIdInHtml(indexPath, project);
          fs.renameSync(indexPath, tmpIndexPath);
        }
      });
    },
  };
}
