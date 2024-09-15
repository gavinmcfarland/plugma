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

export function renderTemplate(templateOrFilePath, basePath, data = {}) {
	let template;

	// Check if the input is a file or a string
	if (fs.existsSync(path.join(basePath, templateOrFilePath))) {
		// If it's a file, read from the file system
		const absoluteFilePath = path.join(basePath, templateOrFilePath);
		template = fs.readFileSync(absoluteFilePath, 'utf-8');
	} else {
		// Otherwise, treat it as a template string
		template = templateOrFilePath;
	}

	// Pass the include function with an optional data and escape argument
	return ejs.render(template, {
		...data, // Merge base data
		include: (file, options = {}) => {
			const { escape = false } = options;  // Destructure escape and additionalData
			const mergedData = { ...data, ...options };  // Merge parent data with additionalData
			const content = renderTemplate(file, basePath, mergedData);  // Pass merged data to the child template
			return escape ? escapeScriptTags(content) : content;
		}
	});
}

// Example usage:

// Rendering from a file
// const renderedFromFile = renderTemplate('templateFile.html', basePath, data);
// console.log(renderedFromFile);
