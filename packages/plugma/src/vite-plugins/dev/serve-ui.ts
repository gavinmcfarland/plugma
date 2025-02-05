import type { PluginOptions } from '#core/types.js';
import { Logger } from '#utils/log/logger.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Plugin } from 'vite';

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
    name: 'plugma:serve-ui',
    configureServer(server) {
      // Add middleware to serve UI at root
      server.middlewares.use('/', async (req, res, next) => {
        if (req.url === '/' || req.url === '/index.html') {
          try {
            // Load template if not already loaded
            if (!template) {
              const templatePath = join(process.cwd(), 'ui.html');
              try {
                template = await readFile(templatePath, 'utf8');
              } catch (error) {
                log.error('Failed to read UI template:', error);
                template = '<div id="app"></div>';
              }
            }

            // Transform and serve the UI HTML
            const html = await server.transformIndexHtml('/', template);
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Access-Control-Allow-Origin', '*');
						res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
						res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');
						res.setHeader('Access-Control-Expose-Headers', 'Content-Range');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.end(html);
          } catch (error) {
            log.error('Failed to serve UI:', error);
            next(error);
          }
        } else {
          next();
        }
      });
    },
  };
}
