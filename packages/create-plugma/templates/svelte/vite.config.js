/** @type {import('vite').UserConfig} */

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { mergeConfig } from 'vite';
import baseConfig from 'plugma/lib/vite.config.js';

export default mergeConfig(baseConfig, {
	plugins: [
		svelte(),
	],
});
