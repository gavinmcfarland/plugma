import type { PluginOptions } from "#core/types.js";
import { Logger } from "#utils/log/logger.js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Plugin } from "vite";
import { fileURLToPath } from "url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = process.cwd();

/**
 * Creates a Vite plugin that serves the UI at the root path.
 * This ensures that the UI is always accessible at http://localhost:PORT/
 * regardless of the actual file location.
 *
 * @param options - Plugin options including debug flag
 * @returns Vite plugin configuration
 */
export function serveUi(options: PluginOptions): Plugin {
	const log = new Logger({ debug: options.debug });
	let template: string | null = null;

	return {
		name: "plugma:serve-ui",
		configureServer(server) {
			// Add middleware to serve UI at root
			server.middlewares.use("/", async (req, res, next) => {
				if (req.url === "/" || req.url === "/index.html") {
					try {
						// Was ui.html, but now using index.html
						const localTemplatePath = path.join(process.cwd(), "index.html");
						const defaultTemplatePath = path.join(
							__dirname,
							"../../../",
							"templates/ui.html",
						);
						let templatePath = defaultTemplatePath;

						// Use local template if it exists
						if (fs.existsSync(localTemplatePath)) {
							templatePath = localTemplatePath;
						}
						// Load template if not already loaded
						if (!template) {
							try {
								template = await readFile(templatePath, "utf8");
							} catch (error) {
								log.error("Failed to read UI template:", error);
								template = '<div id="app"></div>';
							}
						}

						// Transform and serve the UI HTML
						const html = await server.transformIndexHtml("/", template);
						res.setHeader("Content-Type", "text/html");
						res.setHeader(
							"Cache-Control",
							"no-cache, no-store, must-revalidate",
						);
						res.setHeader("Access-Control-Allow-Origin", "*");
						res.setHeader(
							"Access-Control-Allow-Methods",
							"GET, POST, PUT, DELETE, PATCH, OPTIONS",
						);
						res.setHeader(
							"Access-Control-Allow-Headers",
							"X-Requested-With, content-type, Authorization",
						);
						res.setHeader("Access-Control-Expose-Headers", "Content-Range");
						res.setHeader("Pragma", "no-cache");
						res.setHeader("Expires", "0");
						res.end(html);
					} catch (error) {
						log.error("Failed to serve UI:", error);
						next(error);
					}
				} else {
					next();
				}
			});
		},
	};
}
