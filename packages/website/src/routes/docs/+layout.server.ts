import fs from 'fs';
import path from 'path';

export const prerender = true;

export async function load(data: { params: Record<string, string> }) {
	const contentDir = path.join(process.cwd(), 'content/docs');

	function getMarkdownFiles(dir: string, parentPath: string = '') {
		const items: any[] = [];
		const folders: any[] = [];

		const files = fs.readdirSync(dir);

		files.forEach((file) => {
			const fullPath = path.join(dir, file);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				// Handle directory
				const match = file.match(/^(\d+)-(.+)$/);
				const order = match ? parseInt(match[1], 10) : null;
				const folderName = match ? match[2] : file;

				// Special handling for 'index' folder
				const newParentPath =
					folderName === 'index'
						? ''
						: parentPath
							? `${parentPath}/${folderName}`
							: folderName;

				const folderFiles = getMarkdownFiles(fullPath, newParentPath);
				if (folderFiles.items.length > 0 || folderFiles.folders.length > 0) {
					folders.push({
						name: folderName,
						order: order ?? Infinity,
						...folderFiles
					});
				}
			} else if (file.endsWith('.md')) {
				// Handle markdown file
				const match = file.match(/^(\d+)-(.+)\.md$/);
				const order = match ? parseInt(match[1], 10) : null;
				const fileName = match ? match[2] : file.replace('.md', '');
				const slug = parentPath ? `${parentPath}/${fileName}` : fileName;

				const fileContent = fs.readFileSync(fullPath, 'utf-8');
				const titleMatch = fileContent.match(/^# (.+)$/m);
				const title = titleMatch ? titleMatch[1] : fileName.replace(/-/g, ' ');

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
		// Sort folders by order
		folders.sort((a, b) => a.order - b.order);

		// Remove order property after sorting
		const cleanedItems = items.map(({ order, ...rest }) => rest);
		const cleanedFolders = folders.map(({ order, ...rest }) => rest);

		return {
			items: cleanedItems,
			folders: cleanedFolders
		};
	}

	const result = getMarkdownFiles(contentDir);

	return {
		navItems: result.items,
		folders: result.folders
	};
}
