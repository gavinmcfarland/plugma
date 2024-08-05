/** @type {import('vite').UserConfig} */


import baseConfig from 'plugma/lib/vite.config.js';
import { defineConfig, mergeConfig } from "vite";
import vue from '@vitejs/plugin-vue'

export default defineConfig(
	mergeConfig(baseConfig, {
		plugins: [vue()],
	})
);


