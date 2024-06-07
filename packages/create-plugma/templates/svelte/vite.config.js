/** @type {import('vite').UserConfig} */

import { svelte } from "@sveltejs/vite-plugin-svelte";
import baseConfig from 'plugma/lib/vite.config.js';
import { defineConfig, mergeConfig } from "vite";

export default defineConfig(mergeConfig(baseConfig, {
	plugins: [svelte({
		// Need this so that vite recognises plugma files
		include: ["src/**/*.svelte", ".plugma/**/*.svelte", "node_modules/plugma/frameworks/svelte/**/*.svelte"],
	})]
}));


