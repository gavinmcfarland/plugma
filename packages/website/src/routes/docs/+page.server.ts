import fs from 'fs';
import path from 'path';
import { error, redirect } from '@sveltejs/kit';

export async function load() {
	// Define the path to the content folder
	const contentDir = path.join(process.cwd(), 'content/docs');

	// Helper function to get first markdown file without number prefix
	const getFirstMarkdownFile = (directory: string) => {
		if (!fs.existsSync(directory)) return null;
		const files = fs.readdirSync(directory);
		const markdownFiles = files.filter((file) => file.endsWith('.md'));
		if (markdownFiles.length === 0) return null;
		return markdownFiles[0].replace(/^\d+-/, '').replace('.md', '');
	};

	// Helper function to find index directory (including numbered prefixes)
	const findIndexDirectory = (baseDir: string) => {
		if (!fs.existsSync(baseDir)) return null;
		const items = fs.readdirSync(baseDir);
		const indexDirs = items.filter((item) => {
			const fullPath = path.join(baseDir, item);
			return fs.statSync(fullPath).isDirectory() && /^(\d+-)?index$/.test(item);
		});
		return indexDirs.length > 0 ? path.join(baseDir, indexDirs[0]) : null;
	};

	// Check index directory first, then main directory
	const indexDir = findIndexDirectory(contentDir);
	const indexSlug = indexDir ? getFirstMarkdownFile(indexDir) : null;
	const mainSlug = getFirstMarkdownFile(contentDir);

	if (indexSlug) {
		redirect(307, `/docs/${indexSlug}`);
	} else if (mainSlug) {
		redirect(307, `/docs/${mainSlug}`);
	}

	// If no Markdown files exist in either location, return a 404 error
	throw error(404, 'Page not found');
}
