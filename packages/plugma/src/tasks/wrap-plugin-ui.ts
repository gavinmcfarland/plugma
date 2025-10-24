import { getDirName } from '../utils/index.js';
import { getUserFiles } from '../shared/index.js';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { ListrLogLevels, ListrTask, Listr } from 'listr2';
import { BuildCommandOptions, DevCommandOptions, PreviewCommandOptions } from '../utils/create-options.js';
import { createDebugAwareLogger } from '../utils/debug-aware-logger.js';

interface WrapPluginUIContext {
	runtimeData?: string;
	template?: string;
	finalContent?: string;
	outputPath?: string;
}

export const createWrapPluginUiTask = <T extends { uiDuration?: number }>(
	options: DevCommandOptions | BuildCommandOptions | PreviewCommandOptions,
): ListrTask<T> => {
	return {
		title: 'Wrap Plugin UI',
		task: async (ctx, task) => {
			const logger = createDebugAwareLogger(options.debug);

			const files = await getUserFiles(options);

			if (!files.manifest.ui) {
				logger.log(ListrLogLevels.SKIPPED, 'No UI specified in manifest, skipping wrap-plugin-ui task');
				return { outputPath: undefined };
			}

			const uiPath = resolve(files.manifest.ui);
			const fileExists = await access(uiPath)
				.then(() => true)
				.catch(() => false);

			if (!fileExists) {
				logger.log(ListrLogLevels.SKIPPED, `UI file not found at ${uiPath}, skipping wrap-plugin-ui task`);
				return { outputPath: undefined };
			}

			const outputPath = join(options.output || 'dist', 'ui.html');
			options.manifest = files.manifest;

			return task.newListr<WrapPluginUIContext>([
				{
					title: 'Prepare runtime data',
					task: async (ctx) => {
						ctx.runtimeData = `<script>
						// Global variables defined on the window object
						window.runtimeData = ${JSON.stringify(options, null, 2)};
						</script>`;
					},
				},
				{
					title: 'Load template',
					task: async (ctx) => {
						const templatePath = resolve(getDirName(), '../apps/figma-bridge.html');
						try {
							ctx.template = await readFile(templatePath, 'utf-8');
						} catch (error) {
							throw new Error(`Template file not found at ${templatePath}`);
						}
					},
				},
				{
					title: 'Inject runtime data',
					task: async (ctx) => {
						if (!ctx.template || !ctx.runtimeData) {
							throw new Error('Missing template or runtime data');
						}
						ctx.finalContent = ctx.template.replace(/^/, ctx.runtimeData);
					},
				},
				{
					title: 'Write wrapped UI',
					task: async (ctx) => {
						if (!ctx.finalContent) {
							throw new Error('Missing final content');
						}
						await mkdir(dirname(outputPath), { recursive: true });
						await writeFile(outputPath, ctx.finalContent, 'utf-8');
						ctx.outputPath = outputPath;
					},
				},
			]);
		},
	};
};
