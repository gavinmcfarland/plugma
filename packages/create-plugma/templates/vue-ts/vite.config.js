/** @type {import('vite').UserConfig} */

import vue from '@vitejs/plugin-vue'
import { defineConfig } from "vite";

export default defineConfig(() => {
	return {
		plugins: [vue()]
	}
});
