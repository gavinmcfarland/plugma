import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import replace from '@rollup/plugin-replace';
import path from 'path';

// const mode = process.env.NODE_ENV;

export default defineConfig({
	plugins: [
		sveltekit(),
		replace({
			preventAssignment: true,
			__STANCY_SERVER__: 'http://localhost:4000'
		})
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src') // Alias '@' to the 'src' directory
		}
	},
	optimizeDeps: {
		include: ['@plugma/shared']
	},
	build: {
		commonjsOptions: {
			include: [/@plugma\/shared/, /node_modules/]
		}
	}
});
