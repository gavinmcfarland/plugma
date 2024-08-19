import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";
import { dirname, resolve, parse, join } from 'path';
import fs from "fs";
import { fileURLToPath } from 'url';
import viteCopyDirectoryPlugin from './vite-plugin-copy-dir.js';
// import svgLoader from "vite-svg-loader";
import lodashTemplate from 'lodash.template'

const CURR_DIR = process.cwd();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createBuildConfig() {

	let data = fs.readFileSync(resolve('./package.json'), 'utf8')

	data = JSON.parse(data)

	// Loop though ui field
	let object = {}

	if (typeof data["plugma"]["manifest"].ui === "string") {
		Object.assign(object, {
			"index": data["plugma"]["manifest"].ui
		})
	}
	else {
		Object.assign(object, data["plugma"]["manifest"].ui)
	}

	// Create folders

	let viteObject = {}

	for (const [key, value] of Object.entries(object)) {

		// Remove src form value
		let newValue = value.replace('src/', '')
		// Replace extension with .html
		newValue = newValue.replace('.ts', '.html')

		// Create file from template
		let template = fs.readFileSync(`${__dirname}/../templates/index.html`, 'utf8');
		let filePath = join(`${__dirname}/../tmp/${key}`)

		let comptempl = lodashTemplate(template)

		// FIX ME: This is not doing anything at the moment. This should probably happen in the build/dev script instead?
		let templateData = {
			name: "figma",
			input: "/" + value
		}

		if (key === 'index') {
			filePath = join(`${__dirname}/../tmp/`)
		}



		template = comptempl(templateData)

		// FIX ME: Add exception if index, then just output index.html
		createFileWithDirectory(filePath, 'index.html', template);
		viteObject["input"] = join(filePath, 'index.html')
	}

	return viteObject

}

function createFileWithDirectory(filePath, fileName, fileContent, callback) {

	function callback(err, result) {
		if (err) {
			console.error('Error:', err);
		} else {
			console.log(result);
		}
	}
	// Extract the directory path
	const directoryPath = dirname(resolve(filePath, fileName));

	// Use fs.mkdir to create the directory
	fs.mkdir(directoryPath, { recursive: true }, (err) => {
		if (err) {
			callback(err);
		} else {
			// Write to the file using fs.writeFile
			fs.writeFile(resolve(filePath, fileName), fileContent, 'utf8', (err) => {
				if (err) {
					callback(err);
				} else {
					// callback(null, `${fileName} created successfully!`);
				}
			});
		}
	});
}


// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		{
			// Insert catchFigmaStyles and startWebSocketServer
			name: 'html-transform',
			transformIndexHtml(html) {
				const scriptTag = `<script type="module" src="/node_modules/plugma/frameworks/common/ui/catchFigmaStyles.ts"></script>
			<script type="module" src="/node_modules/plugma/frameworks/common/ui/startWebSocketServer.ts"></script>`;
				html = html.replace('</body>', `</body>${scriptTag}`)

				let devToolbarFile = fs.readFileSync(resolve(`${__dirname}/../frameworks/common/main/devToolbar.html`), 'utf-8')

				return html.replace('<body>', `<body>${devToolbarFile}`);
			},
			apply: 'serve'
		},
		{
			// Point / to index.html
			name: "deep-index",
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					if (req.url === "/") {
						req.url = "/node_modules/plugma/tmp/index.html";
					}
					next();
				});
			},
		},
		viteSingleFile(),
		viteCopyDirectoryPlugin({
			// Copy index to dist
			sourceDir: 'dist/node_modules/plugma/tmp/',
			targetDir: 'dist/',
		}),
		// svgLoader({
		//     defaultImport: "raw", // or 'raw'
		// }),
	],
	// publicDir: "public-2",
	// root: path.resolve(CURR_DIR, 'src'),

	// Add output of viteConfig here
	build: {
		// outDir: "../dist",
		// Replace with createBuildConfig()
		rollupOptions: {
			input: "node_modules/plugma/tmp/index.html",
		}
	},

});
