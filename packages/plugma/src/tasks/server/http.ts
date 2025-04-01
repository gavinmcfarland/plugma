import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as fs from "node:fs";

// Create HTTP server
export const httpServer = createServer((req, res) => {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);

	if (req.url === "/" || req.url?.startsWith("/?type=")) {
		fs.readFile(join(__dirname, "client.html"), (err, content) => {
			if (err) {
				res.writeHead(500);
				res.end("Error loading client.html");
				return;
			}
			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(content);
		});
	} else if (req.url?.startsWith("/client/")) {
		// Serve client-side files
		const filePath = join(__dirname, req.url);
		fs.readFile(filePath, (err, content) => {
			if (err) {
				res.writeHead(404);
				res.end("File not found");
				return;
			}
			const ext = req.url!.split(".").pop();
			const contentType =
				ext === "js" ? "application/javascript" : "text/plain";
			res.writeHead(200, { "Content-Type": contentType });
			res.end(content);
		});
	} else {
		res.writeHead(404);
		res.end("Not found");
	}
});
