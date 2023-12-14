/** @type {import('vite').UserConfig} */

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { mergeConfig } from 'vite';
import baseConfig from 'plugma/lib/vite.config.js';

export default mergeConfig(baseConfig, {
	plugins: [
		svelte({
			// Need this so that vite recognises plugma files
			include: ["src/**/*.svelte", ".plugma/**/*.svelte", "node_modules/plugma/frameworks/svelte/**/*.svelte"],
		}),
	],
});
