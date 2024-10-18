import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import replace from '@rollup/plugin-replace';

// const mode = process.env.NODE_ENV;

export default defineConfig({
	plugins: [
		sveltekit(),
		replace({
			preventAssignment: true,
			__STANCY_SERVER__: 'http://localhost:4000'
		})
	]
});
