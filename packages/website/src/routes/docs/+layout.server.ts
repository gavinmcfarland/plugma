import fs from 'fs';
import path from 'path';

export async function load() {
	const contentDir = path.resolve('src/content');
	const files = fs.readdirSync(contentDir);
	const markdownFiles = files.filter((file) => file.endsWith('.md'));

	if (markdownFiles.length > 0) {
		const items = markdownFiles.map((file) => {
			const filePath = path.join(contentDir, file);
			const fileContent = fs.readFileSync(filePath, 'utf-8');

			// Extract the title, assuming it's the first line and starts with '# '
			const titleMatch = fileContent.match(/^# (.+)$/m);
			const title = titleMatch ? titleMatch[1] : file.replace(/-/g, ' ').replace('.md', '');

			return {
				slug: file.replace('.md', ''),
				title
			};
		});

		return {
			navItems: items
		};
	}
}
