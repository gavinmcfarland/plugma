import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";
// import svgLoader from "vite-svg-loader";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		viteSingleFile()
		// svgLoader({
		//     defaultImport: "raw", // or 'raw'
		// }),
	],
	root: "./src",
	build: {
		outDir: "../dist",
		rollupOptions: {
			input: "./src/index.html",
		},
	},

});
