import fs from 'node:fs';
import path from 'node:path';

import type { Plugin, UserConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

import type { PluginOptions, UserFiles } from '#core/types.js';
import { defaultLogger, writeTempFile } from '#utils';
import { getDirName } from '#utils/path.js';
import {
  deepIndex,
  dotEnvLoader,
  htmlTransform,
  replacePlaceholders,
  rewritePostMessageTargetOrigin,
  vitePluginInsertCustomFunctions,
} from '#vite-plugins';

const projectRoot = path.join(getDirName(import.meta.url), '../../..');

const uiHtml = path.join(projectRoot, 'templates/ui.html');

// Read the compiled banner code from dist
const bannerCode = fs.readFileSync(
  path.join(projectRoot, 'dist/utils/cli/banner.js'),
  'utf8',
);

export type ViteConfigs = {
  ui: {
    dev: UserConfig;
    build: UserConfig;
  };
  main: {
    dev: UserConfig;
    build: UserConfig;
  };
};

// TODO Check if this should become a task

/**
 * Creates Vite configurations for both development and build
 *
 * Note: The original function returned an object with the keys
 * `vite` (for the UI) and `viteMain` (for the main).
 * Each of those objects had the keys `dev` and `build` with the
 * vite config for the respective plugma commands.
 *
 * @param options - Plugin configuration options
 * @param userFiles - User's plugin files configuration
 * @returns Vite configurations for different environments
 *
 * Tracking:
 * - [x] Add UI configuration
 *   - Verified comprehensive UI config handling:
 *   - Dev mode: HMR, port config, plugins (replaceMainInput, htmlTransform, deepIndex)
 *   - Build mode: Single file output, proper file naming, asset handling
 * - [x] Implement main configuration
 *   - Verified main config features:
 *   - Dev mode: Environment vars, custom functions injection, CJS format
 *   - Build mode: Library build, Chrome target, sourcemap control
 * - [x] Add plugin integration
 *   - Verified plugin system:
 *   - Common plugins: viteSingleFile, gatherBuildOutputs
 *   - UI plugins: replaceMainInput, htmlTransform, deepIndex
 *   - Main plugins: dotEnvLoader, insertCustomFunctions
 * - [x] Handle environment features
 *   - Verified environment handling:
 *   - Mode configuration (dev/prod)
 *   - Environment variables
 *   - Chrome target compatibility
 *   - Source map control
 *   - Watch mode management
 */
export function createViteConfigs(
  options: PluginOptions,
  userFiles: UserFiles,
): ViteConfigs {
  defaultLogger.debug('Creating Vite configs with:', {
    browserIndexPath: uiHtml,
    outputDir: options.output,
    cwd: process.cwd(),
  });

  // Copy template to the current working directory
  const localUiHtml = path.join(process.cwd(), 'ui.html');
  fs.copyFileSync(uiHtml, localUiHtml);

  const commonVitePlugins: Plugin[] = [
    // gatherBuildOutputs({
    //   sourceDir: options.output,
    //   outputDir: options.output,
    //   filter: (file) => !file.includes('plugma-create-release.yml'),
    //   getOutputPath: (file: string) => {
    //     defaultLogger.debug('getOutputPath called with:', {
    //       file,
    //       basename: path.basename(file),
    //       dirname: path.dirname(file),
    //     });
    //     return path.basename(file);
    //   },
    //   removeSourceDir: false,
    // }),
    viteSingleFile(),
  ];

  const tempFilePath = writeTempFile(
    `temp_${Date.now()}.js`,
    userFiles,
    options,
  );
  options.manifest = userFiles.manifest;

  const placeholders = {
    pluginName: userFiles.manifest.name,
    pluginUi: `<script type="module" src="${userFiles.manifest.ui}"></script>`,
  };
  const viteConfigUI = {
    dev: {
      mode: options.mode,
      define: { 'process.env.NODE_ENV': JSON.stringify(options.mode) },
      plugins: [
        replacePlaceholders(placeholders),
        htmlTransform(options),
        deepIndex({ path: localUiHtml }),
        rewritePostMessageTargetOrigin(),
        ...commonVitePlugins,
      ],
      server: {
        port: options.port,
      },
    },
    build: {
      root: process.cwd(),
      base: './',
      build: {
        outDir: path.resolve(process.cwd(), options.output),
        emptyOutDir: false,
        write: true,
        rollupOptions: {
          input: localUiHtml,
          output: {
            entryFileNames: '[name].js',
            chunkFileNames: '[name].js',
            assetFileNames: (assetInfo: { name?: string }) => {
              defaultLogger.debug('assetFileNames called with:', assetInfo);
              if (!assetInfo.name) return '[name].[ext]';
              const basename = path.basename(assetInfo.name);
              return basename === 'ui.html' ? 'ui.html' : basename;
            },
          },
        },
      },
      plugins: [replacePlaceholders(placeholders), ...commonVitePlugins],
    },
  };

  const injectedCode = bannerCode.replace(
    '/*--[ RUNTIME_DATA ]--*/',
    `const runtimeData = ${JSON.stringify(options)};`, // Remove 'as const' since it's JS now
  );

  const viteConfigMainBuild: UserConfig = {
    mode: options.mode,
    define: {
      'process.env.NODE_ENV': JSON.stringify(options.mode),
    },
    plugins: [dotEnvLoader(options)],
    build: {
      lib: {
        entry: tempFilePath,
        formats: ['cjs'],
        fileName: () => 'main.js',
      },
      rollupOptions: {
        output: {
          dir: options.output,
          entryFileNames: 'main.js',
          inlineDynamicImports: true,
          format: 'cjs',
          exports: 'auto',
          generatedCode: {
            constBindings: true,
            objectShorthand: true,
          },
        },
        external: ['figma'],
      },
      target: 'chrome58',
      sourcemap: false,
      minify: options.command === 'build',
      emptyOutDir: false,
      write: true,
      watch: null,
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
  } satisfies UserConfig;

  const viteConfigMainDev: UserConfig = {
    mode: options.mode,
    define: {
      'process.env.NODE_ENV': JSON.stringify(options.mode),
      'process.env.COMMAND': JSON.stringify(options.command),
      'process.env.DEBUG': JSON.stringify(!!options.debug),
      // Figma function replacements
      'figma.ui.resize': 'customResize',
      'figma.showUI': 'customShowUI',
      'figma.clientStorage': 'customClientStorage',
    },
    plugins: [
      dotEnvLoader({
        ...options,
        // Add additional env file patterns if needed
        patterns: ['*.env.*'],
      }),
      vitePluginInsertCustomFunctions({
        codeToPrepend: injectedCode,
      }),
    ],
    build: {
      lib: {
        entry: tempFilePath,
        formats: ['cjs'],
        fileName: () => 'main.js',
      },
      rollupOptions: {
        output: {
          dir: options.output,
          entryFileNames: 'main.js',
          inlineDynamicImports: true,
        },
      },
      target: 'chrome58',
      sourcemap: false,
      emptyOutDir: false,
      write: true,
      watch:
        options.watch || ['dev', 'preview'].includes(options.command ?? '')
          ? {
              clearScreen: false,
              exclude: ['node_modules/**'],
            }
          : null,
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
  } satisfies UserConfig;

  return {
    ui: viteConfigUI,
    main: {
      dev: viteConfigMainDev,
      build: viteConfigMainBuild,
    },
  };
}
