import fs from 'fs/promises';
import path from 'path';
import { dirname } from 'path';
import { createServer, build } from 'vite';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function buildPages() {
	const config = {
		configFile: false,
		root: __dirname,
		build: {
			rollupOptions: {
				input: {
					test: path.resolve('./testing/test.js'),
					index: path.resolve('./index.html'),
				}
			},
			outDir: path.resolve(__dirname, 'dist'),
			// emptyOutDir: true,
		}
	}
	try {

		const server = await createServer({
			...config,
			server: {
				port: 5173, // You can adjust the port if needed
			},
		});

		await server.listen(); // Start the Vite server
	}
	catch (err) {
		console.error('Error starting Vite server:', err);
		process.exit(1);
	}




	// Build the entry point
	await build(config);

	// await server.listen(); // Start the Vite server

	// Capture the generated HTML content
	// const { html } = await server.ssrLoadModule('/src/main.js');

	// // Write the bundled HTML to a new file
	// const outputPath = path.resolve(__dirname, 'dist', entryPoint);
	// await fs.writeFile(outputPath, html);

	// Close the Vite server
	// await server.close();
	// }
}

buildPages().catch((error) => {
	console.error(error);
	process.exit(1);
});
