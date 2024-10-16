/** @type {import('vite').UserConfig} */

import marko from '@marko/vite';
import figmaAdapter from "@space/run-adapter-figma";
import { defineConfig } from "vite";

export default defineConfig(() => {
	return {
		plugins: [marko({
			adapter: figmaAdapter()
		})]
	}
});


