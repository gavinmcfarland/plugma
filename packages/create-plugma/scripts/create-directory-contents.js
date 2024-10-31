import slugify from 'slugify';
import * as fs from 'fs';
const CURR_DIR = process.cwd();
import _ from 'lodash'
import path from 'path';
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';

const versionsPath = join(
	dirname(fileURLToPath(import.meta.url)),
	'../versions.json'
);
const versions = JSON.parse(fs.readFileSync(versionsPath, 'utf8'));

const __dirname = dirname(fileURLToPath(import.meta.url));

const createDirectoryContents = (templatePath, newProjectPath, answers) => {


	// let newProjectPath = answers['project-name']
	const filesToCreate = fs.readdirSync(templatePath);

	filesToCreate.forEach(file => {
		const origFilePath = `${templatePath}/${file}`;

		// get stats about the current file
		const stats = fs.statSync(origFilePath);

		if (stats.isFile()) {
			let contents = fs.readFileSync(origFilePath, 'utf8');

			_.templateSettings.interpolate = /<%=([\s\S]+?)%>/g;   // For escaped HTML output
			_.templateSettings.escape = /<%-([\s\S]+?)%>/g;         // For unescaped raw output
			_.templateSettings.evaluate = /<%([\s\S]+?)%>/g;

			let comptempl = _.template(contents)


			// Need to manually update versions before publishing. Need a way to automate this. Issue is that this version belongs in a different package, so this doesn't work when user runs create plugma
			let data = Object.assign(answers, {
				id: slugify(answers['name']),
				versions
			})

			if (file === "manifest.json" ||
				file === "package.json" ||
				file.toUpperCase() === "README.MD") {
				contents = comptempl(data);
			}

			// Rename gitignore when duplicating directory
			if (file === 'gitignore') file = '.gitignore';

			const writePath = `${CURR_DIR}/${newProjectPath}/${file}`;
			fs.writeFileSync(writePath, contents, 'utf8');
		} else if (stats.isDirectory()) {
			fs.mkdirSync(`${CURR_DIR}/${newProjectPath}/${file}`);

			// Recursive call to do this for each directory in the current directory
			createDirectoryContents(`${templatePath}/${file}`, `${newProjectPath}/${file}`, answers);
		}
	});
};

export default createDirectoryContents;
