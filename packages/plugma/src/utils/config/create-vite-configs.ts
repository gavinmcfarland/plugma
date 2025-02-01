import fs from 'node:fs';
import path from 'node:path';

import type { Plugin, UserConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

import type { PluginOptions, UserFiles } from '#core/types.js';
import { writeTempFile } from '#utils';
import { getDirName } from '#utils/path.js';
import {
  deepIndex,
  dotEnvLoader,
  gatherBuildOutputs,
  htmlTransform,
  replaceMainInput,
  rewritePostMessageTargetOrigin,
  vitePluginInsertCustomFunctions,
} from '#vite-plugins';

const __dirname = getDirName(import.meta.url);

const uiHtml = path.join(__dirname, '../../../templates/ui.html');

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
  console.log('Creating Vite configs with:', {
    browserIndexPath: uiHtml,
    outputDir: options.output,
    cwd: process.cwd(),
  });

  const commonVitePlugins: Plugin[] = [
    viteSingleFile(),
    gatherBuildOutputs({
      sourceDir: path.dirname(uiHtml),
      outputDir: path.join(options.output),
      filter: () => true,
      getOutputPath: (file: string) => {
        console.log('getOutputPath called with:', {
          file,
          basename: path.basename(file),
          dirname: path.dirname(file),
        });
        return path.basename(file) === 'browser-index.html'
          ? 'ui.html'
          : path.basename(file);
      },
      removeSourceDir: false,
    }),
  ];

  const tempFilePath = writeTempFile(
    `temp_${Date.now()}.js`,
    userFiles,
    options,
  );
  options.manifest = userFiles.manifest;

  const viteConfig = {
    dev: {
      mode: options.mode,
      define: { 'process.env.NODE_ENV': JSON.stringify(options.mode) },
      plugins: [
        replaceMainInput({
          pluginName: userFiles.manifest.name,
          input: userFiles.manifest.ui,
        }),
        htmlTransform(options),
        deepIndex({ path: uiHtml }),
        rewritePostMessageTargetOrigin(),
        ...commonVitePlugins,
      ],
      server: {
        port: options.port,
      },
    },
    build: {
      build: {
        outDir: path.join(options.output),
        emptyOutDir: false,
        rollupOptions: {
          input: {
            ui: path.resolve(process.cwd(), 'templates/ui.html'),
          },
          output: {
            entryFileNames: '[name].js',
            chunkFileNames: '[name].js',
            assetFileNames: (assetInfo: { name?: string }) => {
              if (assetInfo.name === 'browser-shell.html') {
                return 'ui.html';
              }
              return '[name].[ext]';
            },
          },
        },
      },
      plugins: [
        replaceMainInput({
          pluginName: userFiles.manifest.name,
          input: userFiles.manifest.ui,
        }),
        ...commonVitePlugins,
      ],
    },
  };

  // Read the banner code from utils/cli/banner.js
  const bannerCode = fs.readFileSync(
    path.join(__dirname, '..', 'cli', 'banner.js'),
    'utf8',
  );
  const injectedCode = bannerCode.replace(
    '//>> PLACEHOLDER : runtimeData <<//',
    `let runtimeData = ${JSON.stringify(options)};`,
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
      },
      rollupOptions: {
        output: {
          dir: path.join(options.output),
          entryFileNames: 'main.js',
          inlineDynamicImports: true,
        },
      },
      target: 'chrome58',
      sourcemap: false,
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
      'figma.ui.resize': 'customResize',
      'figma.showUI': 'customShowUI',
    },
    plugins: [
      dotEnvLoader(options),
      vitePluginInsertCustomFunctions({
        codeToPrepend: injectedCode,
      }),
    ],
    build: {
      lib: {
        entry: tempFilePath,
        formats: ['cjs'],
      },
      rollupOptions: {
        output: {
          dir: `${options.output}`,
          entryFileNames: 'main.js',
          inlineDynamicImports: true,
        },
      },
      target: 'chrome58',
      sourcemap: false,
      emptyOutDir: false,
      write: true,
      watch: null,
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
  } satisfies UserConfig;

  return {
    ui: viteConfig,
    main: {
      dev: viteConfigMainDev,
      build: viteConfigMainBuild,
    },
  };
}
