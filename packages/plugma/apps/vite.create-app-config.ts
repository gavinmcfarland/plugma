import path from 'node:path'

import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { viteSingleFile } from 'vite-plugin-singlefile'

import { gatherBuildOutputs } from './gather-build-outputs'

export const createAppConfig = (app: string) => ({
	build: {
		// outDir: `../dist/${app}`,
		minify: false,
		cssCodeSplit: false,
	},

	define: {
		'import.meta.env.PLUGMA_APP_NAME': JSON.stringify(app),
	},

	optimizeDeps: {
		exclude: ['fsevents'],
	},

	plugins: [
		// TODO: Update @sveltejs/vite-plugin-svelte version
		// BUT NOT THE LATEST! The latest version only supports Vite 6 and Svelte 5
		svelte({
			// Consult https://svelte.dev/docs#compile-time-svelte-preprocess
			// for more information about preprocessors
			preprocess: vitePreprocess(),
		}),
		viteSingleFile(),
		gatherBuildOutputs({
			from: `dist`,
			to: '../../dist/apps',
			transformPath: (file) => (file === 'index.html' ? `${app}.html` : file),
			removeSource: true,
		}),
	],

	resolve: {
		alias: {
			'#core': path.resolve(__dirname, '../src/core'),
			'#tasks': path.resolve(__dirname, '../src/tasks'),
			'#utils': path.resolve(__dirname, '../src/utils'),
			'#vite-plugins': path.resolve(__dirname, '../src/vite-plugins'),
		},
	},
})
