import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
	console.log("------------", mode, command);
	return {
		plugins: [svelte()]
	}
});
