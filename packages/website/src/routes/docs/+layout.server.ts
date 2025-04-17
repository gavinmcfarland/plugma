import fs from 'fs';
import path from 'path';

export const prerender = true;

export async function load(data) {
	const contentDir = path.join(process.cwd(), 'content/docs');

	function getMarkdownFiles(dir: string) {
		const items: any[] = [];
		const folders: any[] = [];

		const files = fs.readdirSync(dir);

		files.forEach((file) => {
			const fullPath = path.join(dir, file);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				// Handle directory
				const folderFiles = getMarkdownFiles(fullPath);
				if (folderFiles.items.length > 0 || folderFiles.folders.length > 0) {
					folders.push({
						name: file,
						...folderFiles
					});
				}
			} else if (file.endsWith('.md')) {
				// Handle markdown file
				const match = file.match(/^(\d+)-(.+)\.md$/);
				const order = match ? parseInt(match[1], 10) : null;
				const slug = match ? match[2] : file.replace('.md', '');

				const fileContent = fs.readFileSync(fullPath, 'utf-8');
				const titleMatch = fileContent.match(/^# (.+)$/m);
				const title = titleMatch ? titleMatch[1] : slug.replace(/-/g, ' ');

				items.push({
					order: order ?? Infinity,
					slug,
					title,
					path: path.relative(contentDir, fullPath).replace('.md', '')
				});
			}
		});

		// Sort items by order
		items.sort((a, b) => a.order - b.order);
		// Remove order property after sorting
		const cleanedItems = items.map(({ order, ...rest }) => rest);

		return {
			items: cleanedItems,
			folders
		};
	}

	const result = getMarkdownFiles(contentDir);

	return {
		navItems: result.items,
		folders: result.folders
	};
}
