import fs from 'fs';
import path from 'path';

function findMarkdownFile(baseDir: string, slugParts: string[]): string | null {
	// Join all slug parts to check for direct file match first
	const fullSlug = slugParts.join('/');

	// Recursively search through directories
	function searchDir(dir: string): string | null {
		const files = fs.readdirSync(dir);

		for (const file of files) {
			const fullPath = path.join(dir, file);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				// Recursively search subdirectories
				const found = searchDir(fullPath);
				if (found) return found;
			} else if (stat.isFile() && file.endsWith('.md')) {
				// Get the relative path from the base directory
				const relativeToBase = path.relative(baseDir, fullPath);

				// Split the path into parts and clean each part
				const pathParts = relativeToBase
					.split(path.sep)
					.map((part) => part.replace(/^\d+-/, '').replace(/\.md$/, ''));

				// Compare cleaned path parts with slug parts
				if (
					pathParts.length === slugParts.length &&
					pathParts.every((part, i) => part === slugParts[i])
				) {
					return fullPath;
				}
			}
		}
		return null;
	}

	return searchDir(baseDir);
}

export async function load({ params }) {
	const { slug } = params;
	const slugParts = Array.isArray(slug) ? slug : slug.split('/');
	const contentDir = path.join(process.cwd(), 'content/docs');

	// Find the matching file
	const filePath = findMarkdownFile(contentDir, slugParts);

	if (!filePath) {
		return {
			status: 404,
			error: 'Page not found'
		};
	}

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
			error: 'Page not found'
		};
	}
}
