import fs from 'fs';
import path from 'path';
import { error } from '@sveltejs/kit';

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

				// Special handling for 'index' directory
				if (pathParts.length > 1 && pathParts[0] === 'index') {
					// If we're looking for a single slug part, match it against the second part
					if (slugParts.length === 1 && pathParts[1] === slugParts[0]) {
						return fullPath;
					}
				}

				// Regular path matching
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

	// Return 404 if slug starts with 'index'
	if (slugParts[0] === 'index') {
		throw error(404, 'Page not found');
	}

	const contentDir = path.join(process.cwd(), 'content/docs');

	// Find the matching file
	const filePath = findMarkdownFile(contentDir, slugParts);

	if (!filePath) {
		throw error(404, 'Page not found');
	}

	try {
		// Read the Markdown file content
		const fileContent = fs.readFileSync(filePath, 'utf-8');
		const htmlContent = fileContent;

		// Extract title from first h1 that's not in a code block
		const lines = fileContent.split('\n');
		let inCodeBlock = false;
		let title = 'Untitled';

		for (const line of lines) {
			if (line.trim().startsWith('```')) {
				inCodeBlock = !inCodeBlock;
				continue;
			}

			if (!inCodeBlock) {
				const titleMatch = line.match(/^#\s+(.*)/);
				if (titleMatch) {
					title = titleMatch[1];
					break;
				}
			}
		}

		// Extract h1 and h2 headings and create anchor links, ignoring those in code blocks
		const headings: Array<{ text: string; anchor: string; level: number }> = [];
		inCodeBlock = false;

		lines.forEach((line) => {
			if (line.trim().startsWith('```')) {
				inCodeBlock = !inCodeBlock;
				return;
			}

			if (!inCodeBlock) {
				const headingMatch = line.match(/^(#{1,2})\s+(.*)/);
				if (headingMatch) {
					const level = headingMatch[1].length; // # = 1, ## = 2
					const headingText = headingMatch[2];
					// Convert heading to URL-friendly anchor
					const anchor = headingText
						.toLowerCase()
						.replace(/[^\w\s-]/g, '')
						.replace(/\s+/g, '-');

					headings.push({
						text: headingText,
						anchor: `#${anchor}`,
						level
					});
				}
			}
		});

		return {
			title,
			content: htmlContent,
			headings
		};
	} catch (err) {
		throw error(404, 'Page not found');
	}
}
