import type { PluginOptions } from '#core/types.js';
import type { Plugin } from 'vite';

/**
 * Creates a Vite plugin that injects runtime code after all transformations.
 * This ensures our runtime code isn't affected by Vite's Figma API replacements.
 */
export function injectRuntime(options: {
  runtimeCode: string;
  pluginOptions: PluginOptions;
}): Plugin {
  return {
    name: 'plugma:inject-runtime',
    enforce: 'post',
    transform(code: string, id: string) {
      if (
        options.pluginOptions.manifest?.main &&
        id.endsWith(options.pluginOptions.manifest?.main)
      ) {
				const runtimeData = JSON.stringify(options.pluginOptions, null, 2);

        // Inject our runtime code at the top of the file
        return {
          code: `const runtimeData = ${
						runtimeData
					};
					${
						options.runtimeCode
					}
					${code}`,
          map: null, // We could generate source maps if needed
        };
      }
    },
  };
}
