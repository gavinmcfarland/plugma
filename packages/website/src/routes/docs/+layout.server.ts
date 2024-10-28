import fs from 'fs';
import path from 'path';

export const prerender = true;

export async function load(data) {
	const contentDir = path.join(process.cwd(), 'content/docs');
	const files = fs.readdirSync(contentDir);
	const markdownFiles = files.filter((file) => file.endsWith('.md'));

	if (markdownFiles.length > 0) {
		const items = markdownFiles
			.map((file) => {
				// Match the number at the beginning of the filename (if it exists)
				const match = file.match(/^(\d+)-(.+)\.md$/);
				const order = match ? parseInt(match[1], 10) : null;

				const slug = match ? match[2] : file.replace('.md', '');
				// const slug = file.replace('.md', '');

				const filePath = path.join(contentDir, file);
				const fileContent = fs.readFileSync(filePath, 'utf-8');

				// Extract the title, assuming it's the first line and starts with '# '
				const titleMatch = fileContent.match(/^# (.+)$/m);
				const title = titleMatch ? titleMatch[1] : slug.replace(/-/g, ' ');

				return {
					order: order ?? Infinity, // Assign a large number if no order is found
					slug,
					title
				};
			})
			.sort((a, b) => a.order - b.order) // Sort based on the order number
			.map(({ order, ...rest }) => rest); // Remove the 'order' property after sorting

		return {
			navItems: items
		};
	}
}
