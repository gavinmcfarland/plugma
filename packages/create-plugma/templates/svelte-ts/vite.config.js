/** @type {import('vite').UserConfig} */

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig(() => {
	return {
		plugins: [svelte()]
	}
});
