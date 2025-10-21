/**
 * Build command implementation
 * Handles production builds and watch mode for plugin development
 */

import { type ManifestFile } from '../core/types.js';
import { createBuildMainTask } from '../tasks/build-main.js';
import { createBuildManifestTask, BuildManifestResult } from '../tasks/build-manifest.js';
import { createBuildUiTask } from '../tasks/build-ui.js';
import { Listr, ListrLogger, ListrLogLevels } from 'listr2';
import { BuildCommandOptions } from '../utils/create-options.js';
import { Timer } from '../utils/timer.js';
import { DEFAULT_RENDERER_OPTIONS, SILENT_RENDERER_OPTIONS } from '../constants.js';
import { createDebugAwareLogger } from '../utils/debug-aware-logger.js';
import chalk from 'chalk';

interface BuildContext {
	shown?: boolean;
	raw?: ManifestFile;
	processed?: ManifestFile;
	manifestDuration?: number;
	mainDuration?: number;
	uiDuration?: number;
}

/**
 * Main build command implementation
 * Creates production-ready builds of the plugin
 *
 * @param options - Build configuration options
 * @remarks
 * The build command creates optimized production builds:
 * - Minified and optimized code
 * - Production UI build
 * - Manifest generation
 * - Optional watch mode for development
 */
export async function build(options: BuildCommandOptions): Promise<void> {
	const logger = createDebugAwareLogger(options.debug);

	const timer = new Timer();
	timer.start();

	const tasks = new Listr(
		[
			createBuildManifestTask<BuildContext>(options),
			createBuildMainTask<BuildContext>(options),
			createBuildUiTask<BuildContext>(options),
		],
		{
			concurrent: true,
			...(options.debug ? DEFAULT_RENDERER_OPTIONS : SILENT_RENDERER_OPTIONS),
		},
	);

	try {
		await tasks.run();

		if (options.watch) {
			console.log(`${chalk.green('✔ Watching for changes...')}\n`);
		}
		if (!options.watch) {
			timer.stop();
			console.log(`\n${chalk.green('✔ Plugin built in ' + timer.getDuration() + 'ms')}\n`);
			process.exit(0);
		}
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.log(ListrLogLevels.FAILED, err.message);
		process.exit(1);
	}
}
