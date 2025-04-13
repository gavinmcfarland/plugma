import { Logger } from '#utils';
import type { IndexHtmlTransformContext, Plugin } from 'vite';

const logger = new Logger({
  prefix: 'vite-plugin:placeholders',
  debug: !!process.env.PLUGMA_DEBUG,
});

/**
 * Options for configuring placeholder replacement in HTML templates.
 *
 * For each key in this object, the plugin will replace the corresponding
 * placeholder in the HTML file. The placeholder for a given key must be
 * formatted as:
 *
 *   <!--[ KEY_IN_UPPER_SNAKE_CASE ]-->
 *
 * For example, if you set { pluginName: 'MyPlugin' }, the plugin will replace
 * all occurrences of <!--[ PLUGIN_NAME ]--> in your HTML with "MyPlugin".
 *
 * Consumers of this plugin must ensure their HTML templates contain placeholders
 * in the correct format to allow dynamic replacement based on the provided options.
 * Additional key/value pairs can be provided to create custom replacements.
 *
 * @remarks
 * This interface supports arbitrary key/value pairs. The transformation converts
 * each option key to UPPER_SNAKE_CASE to generate the matching placeholder.
 */
interface ReplacePlaceholdersOptions {
  /**
   * The name of the plugin to be inserted in the HTML template.
   * Example placeholder: <!--[ PLUGIN_NAME ]-->
   */
  pluginName?: string;
  /**
   * The path to the plugin's UI file to be inserted as a script in the HTML template.
   * Example placeholder: <!--[ PLUGIN_UI ]-->
   */
  pluginUi?: string;
  [key: string]: unknown;
}

// Utility function to transform a string to UPPER_SNAKE_CASE.
function toUpperSnakeCase(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
}

/**
 * Replaces placeholders in the given HTML string using the provided options.
 * It iterates over each key in the options object, converts the key to UPPER_SNAKE_CASE,
 * and replaces occurrences of a placeholder (e.g., <!--[ PLUGIN_NAME ]-->) with the corresponding
 * value from the options.
 *
 * @param html - The HTML string where placeholders will be replaced.
 * @param options - An object containing key/value pairs for replacement.
 * @returns The HTML string after applying the replacements.
 *
 * @internal
 */
function _replacePlaceholders(
  html: string,
  options: ReplacePlaceholdersOptions,
): string {
  let result = html;
  logger.debug('replacePlaceholders: Starting replacements');
  for (const key in options) {
    const placeholder = toUpperSnakeCase(key);
    logger.debug(`Replacing "${placeholder}" with "${options[key]}"`);
    result = result.replace(
      new RegExp(`(/\\*|<!)--\\[\\s*${placeholder}\\s*\\]--(>|\\*/)`, 'g'),
      String(options[key]),
    );
  }
  return result;
}

/**
 * Creates a Vite plugin that replaces placeholders in HTML templates based on provided options.
 *
 * This plugin scans HTML files for placeholders formatted as:
 *
 *   <!--[ KEY_IN_UPPER_SNAKE_CASE ]-->
 *
 * and replaces each with the corresponding value from the options object.
 *
 * For example, if the options contain { pluginName: 'MyPlugin' }, the plugin will
 * replace all instances of <!--[ PLUGIN_NAME ]--> in your HTML templates with "MyPlugin".
 *
 * The plugin applies these replacements both during the transformIndexHtml hook (typically
 * for the index.html file) and via a generic transform hook (for other HTML files such as ui.html).
 *
 * @param options - Configuration options for placeholder replacement.
 * @returns A Vite plugin configuration object that applies the configured replacements.
 *
 * @example
 * ```typescript
 * import { replacePlaceholders } from '#vite-plugins';
 *
 * export default defineConfig({
 *   plugins: [
 *     replacePlaceholders({
 *       pluginName: 'MyPlugin',
 *       pluginUi: 'src/ui.ts',
 *     }),
 *   ],
 * });
 * ```
 */
export function replacePlaceholders(
  options: ReplacePlaceholdersOptions = {},
): Plugin {
  return {
    name: 'replace-js-input',
    transformIndexHtml: {
      order: 'pre',
      handler(html: string, ctx: IndexHtmlTransformContext): string {
        logger.debug('replacePlaceholders: transformIndexHtml called');
        return _replacePlaceholders(html, options);
      },
    },

    // Transform hook to handle HTML files beyond index.html (e.g. ui.html in build mode)
    transform(code: string, id: string) {
      if (id.endsWith('.html')) {
        logger.debug(`replacePlaceholders: transform called for ${id}`);
        return _replacePlaceholders(code, options);
      }
      return null;
    },
  };
}

export default replacePlaceholders;
