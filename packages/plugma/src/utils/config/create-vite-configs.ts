import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import type { Plugin, UserConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

import type { PluginOptions, UserFiles } from '../../core/types.js';
import { defaultLogger, writeTempFile } from '../../utils/index.js';
import {
	dotEnvLoader,
	htmlTransform,
	injectRuntime,
	replacePlaceholders,
	replacePlugmaTesting,
	rewritePostMessageTargetOrigin,
	serveUi,
	injectTests,
} from '../../vite-plugins/index.js';
import { createBuildNotifierPlugin } from '../../vite-plugins/build-notifier.js';
import { injectEventListeners } from '../../vite-plugins/main/inject-test-event-listeners.js';
import viteCopyDirectoryPlugin from '../../vite-plugins/move-dir.js';
import devtoolsJson from '../../vite-plugins/devtools-json.js';
import { processEnvMigrationWarning } from '../../vite-plugins/process-env-migration-warning.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const projectRoot = path.join(__dirname, '../../..');

// Use relative path to find templates directory
const plugmaRoot = path.join(__dirname, '../../..');
const templateUiHtmlPath = path.join(plugmaRoot, 'templates', 'vite', 'ui.html');

// Before using the runtime code, bundle it
const runtimeBundlePath = path.join(projectRoot, 'dist/apps/plugma-runtime.js');

const plugmaRuntimeCode = fs.readFileSync(runtimeBundlePath, 'utf8');

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

/**
 * Creates Vite configurations for both development and build
 */
export function createViteConfigs(options: any, userFiles: UserFiles): ViteConfigs {
	// Create a virtual HTML module plugin because Vite complains about the html template being relative or absolute
	const virtualHtmlPlugin: Plugin = {
		name: 'plugma:virtual-html',
		apply: 'build',
		resolveId(id) {
			// Handle our virtual HTML module
			if (id === 'virtual:plugma-ui.html') {
				return id;
			}
			return null;
		},
		load(id) {
			// Return the HTML content for our virtual module
			if (id === 'virtual:plugma-ui.html') {
				// Check for user-provided index.html first (same logic as serveUi plugin)
				const localTemplatePath = path.join(process.cwd(), 'index.html');

				// Find the plugma package root more reliably
				// Look for the templates directory relative to the current file location
				const currentDir = path.dirname(fileURLToPath(import.meta.url));
				const defaultTemplatePath = path.resolve(currentDir, '../../../templates/vite/ui.html');

				let templatePath = defaultTemplatePath;

				// Use local template if it exists
				if (fs.existsSync(localTemplatePath)) {
					templatePath = localTemplatePath;
				}

				try {
					return fs.readFileSync(templatePath, 'utf-8');
				} catch (error) {
					// Provide a more helpful error message
					throw new Error(`Failed to read HTML template file at ${templatePath}: ${error}`);
				}
			}
			return null;
		},
	};

	// Use the virtual module as input
	const resolvedInputPath = 'virtual:plugma-ui.html';

	// TODO: Change so that input is dynamically referenced. Checking if exists in project root and if not, use one from templates. Also should it be called ui.html?
	// defaultLogger.debug('Creating Vite configs with:', {
	// 	browserIndexPath: indexInputPath,
	// 	outputDir: options.output,
	// 	cwd: process.cwd(),
	// })

	const commonVitePlugins: Plugin[] = [
		viteSingleFile(),
		createBuildNotifierPlugin(options.port),
		viteCopyDirectoryPlugin({
			sourceDir: path.join(options.output, 'node_modules', 'plugma', 'templates', 'vite'),
			targetDir: path.join(options.output),
		}),
	].filter(Boolean) as Plugin[];

	const placeholders = {
		pluginName: userFiles.manifest.name,
		pluginUi: `<script type="module" src="/${userFiles.manifest.ui}"></script>`,
	};

	const viteConfigUI = {
		dev: {
			mode: options.mode,
			define: { 'process.env.NODE_ENV': JSON.stringify(options.mode) },
			plugins: [
				replacePlaceholders(placeholders),
				htmlTransform(options),
				rewritePostMessageTargetOrigin(),
				serveUi(options),
				processEnvMigrationWarning(),
				...commonVitePlugins,
				devtoolsJson(),
			],
			server: {
				port: options.port,
				cors: true,
				host: 'localhost',
				strictPort: true,
				middlewareMode: false,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
					'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
					'Access-Control-Allow-Private-Network': 'true',
				},
			},
			logLevel: options.debug ? 'info' : 'error',
		} satisfies UserConfig,
		build: {
			mode: options.mode,
			root: process.cwd(),
			base: './',
			define: { 'process.env.NODE_ENV': JSON.stringify(options.mode) },
			build: {
				outDir: path.resolve(process.cwd(), options.output),
				emptyOutDir: false,
				write: true,
				rollupOptions: {
					input: resolvedInputPath,
					output: {
						entryFileNames: '[name].js',
						chunkFileNames: '[name].js',
						assetFileNames: (assetInfo: { name?: string }) => {
							defaultLogger.debug('assetFileNames called with:', assetInfo);
							if (!assetInfo.name) return '[name].[ext]';

							// Extract just the filename, not the path
							const basename = path.basename(assetInfo.name);

							// Handle the case where the name is a full path
							if (basename === 'ui.html') {
								return 'ui.html';
							}

							// For other files, ensure we only use the filename
							// and sanitize it to remove any path separators
							const sanitizedName = basename.replace(/[\/\\]/g, '_');
							return sanitizedName || '[name].[ext]';
						},
					},
				},
			},
			plugins: [
				replacePlaceholders(placeholders),
				htmlTransform(options),
				rewritePostMessageTargetOrigin(),
				serveUi(options),
				...commonVitePlugins,
				virtualHtmlPlugin,
			],
		} satisfies UserConfig,
	};

	const configKey = options.command === 'build' ? 'build' : 'dev';
	// defaultLogger.debug('Vite config UI (configKey):', viteConfigUI[configKey])

	const tempFilePath = writeTempFile(`temp_${Date.now()}.js`, userFiles, options);

	options.manifest = userFiles.manifest;

	const viteConfigMainBuild: UserConfig = {
		mode: options.mode,
		define: {
			'process.env.NODE_ENV': JSON.stringify(options.mode),
		},
		plugins: [replacePlugmaTesting(options), processEnvMigrationWarning()],
		build: {
			outDir: options.output,
			emptyOutDir: false,
			write: true,
			watch: null,
			target: 'es6',
			sourcemap: 'inline',
			minify: options.command === 'build' && !options.watch,
			lib: {
				name: 'plugmaMain',
				entry: tempFilePath,
				formats: ['iife'],
				fileName: () => 'main.js',
			},
			rollupOptions: {
				output: {
					entryFileNames: 'main.js',
					inlineDynamicImports: true,
				},
				external: ['figma'],
			},
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
		},
		plugins: [
			replacePlugmaTesting(options),
			processEnvMigrationWarning(),
			injectTests({
				testDir: '',
				pluginOptions: options,
			}),
			// REVIEW:Not sure if tempFilePath is better or userFiles.manifest.main
			injectEventListeners(tempFilePath),
			injectRuntime(plugmaRuntimeCode, options),
		],
		build: {
			minify: false,
			lib: {
				name: 'plugmaMain',
				entry: tempFilePath,
				formats: ['iife'],
				fileName: () => 'main.js',
			},
			rollupOptions: {
				output: {
					dir: options.output,
					entryFileNames: 'main.js',
					inlineDynamicImports: true,
				},
			},
			target: 'es6',
			sourcemap: 'inline',
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

	// defaultLogger.debug(`Vite config Main (configKey):`, configKey === 'dev' ? viteConfigMainDev : viteConfigMainBuild)
	return {
		ui: viteConfigUI,
		main: {
			dev: viteConfigMainDev,
			build: viteConfigMainBuild,
		},
	};
}
