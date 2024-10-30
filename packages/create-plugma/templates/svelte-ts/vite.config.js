/** @type {import('vite').UserConfig} */

import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig(() => {
	return {
		plugins: [svelte()]
	}
});
