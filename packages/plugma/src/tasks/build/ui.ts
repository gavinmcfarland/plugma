import type {
  GetTaskTypeFor,
  PluginOptions,
  ResultsOfTask,
} from '#core/types.js';
import { registerCleanup, unregisterCleanup } from '#utils/cleanup.js';
import { cleanManifestFiles } from '#utils/config/clean-manifest-files.js';
import { createViteConfigs } from '#utils/config/create-vite-configs.js';
import { Logger } from '#utils/log/logger.js';
import { access, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import type { ModuleFormat } from 'rollup';
import type { ViteDevServer } from 'vite';
import { type InlineConfig, build, mergeConfig } from 'vite';
import { GetFilesTask } from '../common/get-files.js';
import { task } from '../runner.js';
import { viteState } from '../server/vite.js';

/**
 * Result type for the build-ui task
 */
interface Result {
  /** Path to the built UI HTML file */
  outputPath: string;
  /** Build duration in milliseconds */
  duration?: string;
}

/**
 * Task that builds the plugin's UI interface.
 *
 * This task is responsible for:
 * 1. Building the UI using Vite:
 *    - Configures Vite for IIFE output format
 *    - Handles source maps and minification
 *    - Manages HTML and JS output
 * 2. Managing build state:
 *    - Closes existing UI server if any
 *    - Handles cleanup of build artifacts
 *    - Manages watch mode for development
 *
 * The UI is built from the path specified in manifest.ui and outputs to ui.html.
 * In development mode:
 * - Source maps are enabled for better debugging
 * - Watch mode is enabled for rebuilding on changes
 * - Build artifacts are cleaned up on exit
 *
 * In production mode:
 * - Output is minified
 * - Watch mode is disabled
 * - Build artifacts are preserved
 *
 * @param options - Plugin build options including command, output path, etc
 * @param context - Task context containing results from previous tasks
 * @returns Object containing the output file path and build duration
 */
const buildUi = async (
  options: PluginOptions,
  context: ResultsOfTask<GetFilesTask>,
): Promise<Result> => {
  try {
    const log = new Logger({ debug: options.debug });

    const fileResult = context[GetFilesTask.name];
    if (!fileResult) {
      throw new Error('get-files task must run first');
    }

    const { files } = fileResult;
    const outputPath = join(options.output || 'dist', 'ui.html');

    // Close existing UI server if any
    if (viteState.viteUi) {
      await viteState.viteUi.close();
    }

    // Register cleanup handler
    const cleanup = async () => {
      log.debug('Cleaning up UI build...');
      if (viteState.viteUi) {
        await viteState.viteUi.close();
      }
      // In dev/preview, we want to clean up the build output
      if (options.command !== 'build') {
        try {
          await rm(outputPath, { force: true });
          log.success('Cleaned up UI build output');
        } catch (error) {
          log.error('Failed to clean up UI build output:', error);
        }
      }
    };
    registerCleanup(cleanup);

    // Get Vite config from createConfigs
    const config = createViteConfigs(options, files);

    // Start build timer as close to build as possible
    const startTime = performance.now();

    // Only build if UI is specified and file exists
    if (files.manifest.ui) {
      const uiExists = await access(resolve(files.manifest.ui))
        .then(() => true)
        .catch(() => false);

      if (uiExists) {
        log.debug(`Building UI from ${files.manifest.ui}...`);

        // Build UI with Vite
        if (options.command === 'build' && options.watch) {
          // FIXME: For some reason, it rebuilds ui.html when not specified in manifest during watch
          const watchConfig = mergeConfig(
            {
              build: {
                watch: {},
                minify: true,
                rollupOptions: {
                  output: {
                    format: 'iife' as ModuleFormat,
                  },
                },
              },
            },
            config.ui?.build,
          ) as InlineConfig;

          const watcher = await build(watchConfig);
          if ('close' in watcher) {
            viteState.viteUi = {
              close: async () => {
                await watcher.close();
              },
              // Implement required ViteDevServer interface
              config: {} as any,
              pluginContainer: {} as any,
              middlewares: {} as any,
              httpServer: null,
              watcher: null as any,
              ws: null as any,
              moduleGraph: null as any,
              transformRequest: null as any,
              transformIndexHtml: null as any,
              transformCode: null as any,
              resolvedUrls: null as any,
              ssrTransform: null as any,
              listen: async () => ({ port: 0 }),
              printUrls: () => {},
              bindCLIShortcuts: () => {},
              restart: async () => {},
            } as any as ViteDevServer;
          }
        } else {
          await build(
            mergeConfig(
              {
                build: {
                  minify: true,
                  rollupOptions: {
                    output: {
                      format: 'iife' as ModuleFormat,
                    },
                  },
                },
              },
              config.ui?.build,
            ) as InlineConfig,
          );
        }
      }
    }

    // Calculate elapsed time in milliseconds
    const endTime = performance.now();
    const duration = (endTime - 250 - startTime).toFixed(0); // Remove decimals for a Vite-like appearance

    // Show build status
    if (
      !options.watch &&
      files.manifest.main &&
      (await access(resolve(files.manifest.main))
        .then(() => true)
        .catch(() => false))
    ) {
      if (
        !files.manifest.ui ||
        (files.manifest.ui &&
          (await access(resolve(files.manifest.ui))
            .then(() => true)
            .catch(() => false)))
      ) {
        log.success(`build created in ${duration}ms\n`);
      }
    }

    // Clean manifest files
    cleanManifestFiles(options, files, 'plugin-built');

    // Unregister cleanup handler in build mode
    if (options.command === 'build') {
      unregisterCleanup(cleanup);
    }

    return { outputPath, duration };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to build UI: ${errorMessage}`);
  }
};

export const BuildUiTask = task('build:ui', buildUi);
export type BuildUiTask = GetTaskTypeFor<typeof BuildUiTask>;

export default BuildUiTask;
