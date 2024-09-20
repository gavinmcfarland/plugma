import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteSingleFile } from 'vite-plugin-singlefile'
import renameAndMoveFilesPlugin from './vite-plugin-rename-move-files'
// import replaceIdPlugin from "./vite-plugin-replace-app-id";

// "../packages/plugma/frameworks/common/main/"
export default defineConfig(({ mode }) => {
	console.log('mode', mode)
	return {
		plugins: [
			svelte(),
			{
				name: 'replace app id',
				transformIndexHtml(html) {
					return html.replace('id="replace"', `id="${mode}"`)
				},
			},
			viteSingleFile(),
			renameAndMoveFilesPlugin('dist'),
		],
		build: {
			outDir: `dist/${mode}`,
		},
		define: {
			'import.meta.env.VITE_APP_NAME': JSON.stringify(mode),
		},
		base: `/${mode}/`,
	}
})
