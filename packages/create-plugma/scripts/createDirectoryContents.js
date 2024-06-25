import slugify from '@sindresorhus/slugify';
import * as fs from 'fs';
const CURR_DIR = process.cwd();
import lodashTemplate from 'lodash.template'

const createDirectoryContents = (templatePath, newProjectPath, answers) => {


	// let newProjectPath = answers['project-name']
	const filesToCreate = fs.readdirSync(templatePath);

	filesToCreate.forEach(file => {
		const origFilePath = `${templatePath}/${file}`;

		// get stats about the current file
		const stats = fs.statSync(origFilePath);

		if (stats.isFile()) {
			let contents = fs.readFileSync(origFilePath, 'utf8');



			let comptempl = lodashTemplate(contents)

			let data = Object.assign(answers, {
				id: slugify(answers['name'])
			})

			if (file === "manifest.json" ||
				file === "package.json" ||
				file.toUpperCase() === "READ.MD") {
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
