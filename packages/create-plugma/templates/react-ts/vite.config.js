/** @type {import('vite').UserConfig} */


import baseConfig from 'plugma/lib/vite.config.js';
import { defineConfig, mergeConfig } from "vite";
import react from '@vitejs/plugin-react'

export default defineConfig(
	mergeConfig(baseConfig, {
		plugins: [react()],
	})
);


