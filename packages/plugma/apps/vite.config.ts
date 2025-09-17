import path from 'node:path';

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

import { gatherBuildOutputs } from './gather-build-outputs';

const apps = {
	'dev-server': {
		entry: 'dev-server/main.ts',
	},
	'figma-bridge': {
		entry: 'figma-bridge/main.js',
	},
};

const app = process.env.PLUGMA_APP_NAME;

if (!app) {
	throw new Error('PLUGMA_APP_NAME environment variable is not defined');
}

const appConfig = apps[app as keyof typeof apps];

if (!appConfig) {
	throw new Error(`Unknown app: ${app}. Available apps: ${Object.keys(apps).join(', ')}`);
}

export default defineConfig({
	build: {
		target: 'es6',
		minify: false,
		outDir: `dist/${app}`,
		cssCodeSplit: false,
	},

	define: {
		'import.meta.env.PLUGMA_APP_NAME': JSON.stringify(app),
	},

	resolve: {
		alias: {
			'#core': path.resolve(__dirname, 'src/core'),
			'#tasks': path.resolve(__dirname, 'src/tasks'),
			'#utils': path.resolve(__dirname, '../../src/utils'),
			'#vite-plugins': path.resolve(__dirname, 'src/vite-plugins'),
		},
	},

	plugins: [
		// TODO: Update @sveltejs/vite-plugin-svelte version
		// BUT NOT THE LATEST! The latest version only supports Vite 6 and Svelte 5
		svelte(),
		{
			name: 'html-transform',
			transform(html) {
				return html.replace(/<% appId %>/g, app).replace(/<% entrypoint %>/g, `./${appConfig.entry}`);
			},
		},
		viteSingleFile(),
		gatherBuildOutputs({
			from: 'dist',
			to: '../dist/apps',
			transformPath: (file) => `${path.dirname(file)}.html`,
			removeSource: false,
		}),
	],

	optimizeDeps: {
		exclude: ['fsevents'],
		include: ['child_process', 'util'],
	},

	root: app,
});
