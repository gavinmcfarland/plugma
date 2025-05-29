import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vite.dev/config/
export default defineConfig(({ context }) => {
	return {
		plugins: context === 'ui' ? [svelte()] : [],
	}
})
