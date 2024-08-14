/** @type {import('vite').UserConfig} */

import baseConfig from 'plugma/lib/vite.config.js';
import { defineConfig, mergeConfig } from "vite";
import marko from '@marko/vite';
import figmaAdapter from "@space/run-adapter-figma";

export default defineConfig(mergeConfig(baseConfig, {
	plugins: [marko({
		adapter: figmaAdapter()
	})]
}));


