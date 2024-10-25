import fs from 'fs';
import path from 'path';

export async function load({ params }) {
	const { slug } = params;

	// Find the correct file without the numeric prefix
	const contentDir = path.join(process.cwd(), 'content/docs');
	const files = fs.readdirSync(contentDir);
	const matchingFile = files.find(
		(file) => file.replace(/^\d+-/, '').replace(/\.md$/, '') === slug
	);

	if (!matchingFile) {
		return {
			status: 404,
			error: new Error('Page not found')
		};
	}

	const filePath = path.resolve(contentDir, matchingFile);

	try {
		// Read the Markdown file content
		const fileContent = fs.readFileSync(filePath, 'utf-8');
		// Convert Markdown to HTML
		// const htmlContent = marked(fileContent);
		const htmlContent = fileContent;

		// Return the page title (first heading) and the HTML content
		const titleMatch = fileContent.match(/^#\s+(.*)/);
		const title = titleMatch ? titleMatch[1] : 'Untitled';

		return {
			title,
			content: htmlContent
		};
	} catch (err) {
		return {
			status: 404,
			error: new Error('Page not found')
		};
	}
}
