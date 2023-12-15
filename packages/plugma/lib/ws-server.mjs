import { fileURLToPath } from "url";
import { createServer } from "vite";
import { dirname, resolve } from 'path';

const __dirname = fileURLToPath(new URL(".", import.meta.url));

(async () => {
	const server = await createServer({
		// any valid user config options, plus `mode` and `configFile`
		configFile: resolve(`${__dirname}/vite.config.js`),
		// root: resolve(`${__dirname}/node_modules/plugma/tmp/index.html`),
		server: {
			port: 1337,
		},
	});
	await server.listen();

	server.printUrls();
	server.bindCLIShortcuts({ print: true });
})();
