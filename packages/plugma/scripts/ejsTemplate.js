import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';

// Helper to resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Escape function to replace closing </script> tags
function escapeScriptTags(content) {
	return content.replace(/<\/script>/g, '<\\/script>');
}

export function renderTemplate(filePath, basePath, data = {}) {
	const absoluteFilePath = path.join(basePath, filePath);
	const template = fs.readFileSync(absoluteFilePath, 'utf-8');

	// Pass the file function with an optional data and escape argument
	return ejs.render(template, {
		...data,
		include: (file, options = {}) => {
			const { escape = false, additionalData = {} } = options;  // Destructure escape and additionalData
			const content = renderTemplate(file, basePath, { ...data, ...options });  // Merge additional data
			return escape ? escapeScriptTags(content) : content;
		}
	});
}

// Example usage for testing purposes
// const basePath = path.resolve(__dirname, 'templates'); // You can set the base path where the files are located
// const data = { name: "My Test App" };
// const renderedOutput = renderTemplate('testFile.html', basePath, data);
// console.log(renderedOutput);
