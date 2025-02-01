import type { Plugin, ViteDevServer } from 'vite';

/**
 * A Vite plugin that redirects root requests ('/') to a specific index.html file
 * in the node_modules directory.
 *
 * @param options - Optional configuration options for the plugin (currently unused)
 * @returns A Vite plugin configuration object
 */
export function deepIndex(options: { path: string }): Plugin {
  return {
    name: 'deep-index',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/') {
          req.url = options.path;
        }
        next();
      });
    },
  };
}

export default deepIndex;
