import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vite.dev/config/
export default defineConfig(({ mode, command, context }) => {
	if (context === 'ui') {
		return {
			mode: 'build',
			plugins: [svelte()]
		}
	}
});
