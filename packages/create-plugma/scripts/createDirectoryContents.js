import slugify from '@sindresorhus/slugify';
import * as fs from 'fs';
const CURR_DIR = process.cwd();
import { template } from 'lodash'

// lodashTemplate(buffer.toString())(values)

// let comptempl =
// 	lodashTemplate('Hi <%= author%>!');

// // Assigning the value to the
// // interpolate delimiter
// let result =
// 	comptempl({ 'author': 'Nidhi' });

// // Displays output
// console.log(result);


const createDirectoryContents = (templatePath, newProjectPath, answers) => {

	// let newProjectPath = answers['project-name']
	const filesToCreate = fs.readdirSync(templatePath);

	filesToCreate.forEach(file => {
		const origFilePath = `${templatePath}/${file}`;

		// get stats about the current file
		const stats = fs.statSync(origFilePath);



		if (stats.isFile()) {
			let contents = fs.readFileSync(origFilePath, 'utf8');

			let comptempl = template(contents)
			let data = Object.assign(answers, {
				id: slugify(answers['name'])
			})

			if (file === "manifest.json" ||
				file === "package.json" ||
				file.toUpperCase() === "READ.MD") {
				contents = comptempl(data);
			}

			// Rename
			if (file === 'gitignore') file = '.gitignore';

			const writePath = `${CURR_DIR}/${newProjectPath}/${file}`;
			fs.writeFileSync(writePath, contents, 'utf8');
		} else if (stats.isDirectory()) {
			fs.mkdirSync(`${CURR_DIR}/${newProjectPath}/${file}`);

			// recursive call
			createDirectoryContents(`${templatePath}/${file}`, `${newProjectPath}/${file}`, answers);
		}
	});
};

export default createDirectoryContents;
