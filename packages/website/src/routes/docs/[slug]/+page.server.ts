import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { navItems } from '@/stores.js';

export async function load({ params }) {
	const { slug } = params;
	const filePath = path.resolve('src/content', `${slug}.md`);

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
