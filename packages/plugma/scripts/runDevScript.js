import { createServer } from 'vite';
import esbuild from 'esbuild';
import { exec } from 'child_process';

async function bundleMainWithEsbuild() {
	try {
		// Bundle your .mjs file using esbuild
		await esbuild.build({
			entryPoints: ['src/main.ts'],
			outfile: 'dist/main.js',
			format: 'esm',
			bundle: true,
		});

		console.log('Main bundled successfully with esbuild!');
	} catch (err) {
		console.error('Error bundling file with esbuild:', err);
	}
}

async function startViteServer() {
	try {
		// Create Vite server
		const server = await createServer({
			server: { port: 3000 }, // Specify the port you want to use
		});

		await server.listen(); // Start the Vite server
		console.log('Vite UI server is running on http://localhost:3000');

		// Run your additional Node.js script
		const childProcess = exec('node node_modules/plugma/lib/server-old.cjs');
		childProcess.stdout.on('data', (data) => {
			console.log(`Script output: ${data}`);
		});
		childProcess.stderr.on('data', (data) => {
			console.error(`Script error: ${data}`);
		});
	} catch (err) {
		console.error('Error starting Vite server:', err);
		process.exit(1);
	}
}

// Bundle the file and start the server
bundleMainWithEsbuild().then(startViteServer);
