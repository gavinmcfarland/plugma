import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteSingleFile } from 'vite-plugin-singlefile'
import renameAndMoveFiles from './plugins/vite-plugin-rename-and-move-files'

export default defineConfig(({ mode }) => {
	return {
		plugins: [
			svelte(),
			{
				name: 'replace-main-dir',
				transform(code, id) {

					if (id.endsWith('index.html')) {
						// Check for your entry point file
						return code.replace('<% appDir %>', mode)
					}
					return null
				},
			},
			{
				name: 'replace-app-id',
				transformIndexHtml(html) {
					return html.replace('<% appId %>', mode)
				},
			},
			viteSingleFile(),
			renameAndMoveFiles('dist')
		],

		build: {
			outDir: `dist/${mode}`,
			// To remove legal comments from ReconnectingWebSocket which trips up Figma
			minify: 'terser',
			terserOptions: {
				format: {
					comments: false, // Removes all comments
				},
			},
		},
		// build: {
		// 	cssCodeSplit: true,
		// 	// Use the same entry point for all apps
		// 	rollupOptions: {
		// 		input: 'index.html',
		// 		output: {
		// 			// Separate output for each app to avoid asset merging
		// 			assetFileNames: `${mode}/assets/[name].[hash].[ext]`,
		// 			chunkFileNames: `${mode}/chunks/[name].[hash].js`,
		// 			entryFileNames: `${mode}/[name].[hash].js`,
		// 		},
		// 	},
		// 	// Each app has its own output directory
		// 	outDir: `dist/${mode}`,
		// },
		define: {
			'import.meta.env.VITE_APP_NAME': JSON.stringify(mode),
		},
		base: `/${mode}/`,
	}
})

