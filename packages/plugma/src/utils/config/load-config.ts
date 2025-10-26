import { existsSync } from 'fs';
import { join } from 'node:path';
import { loadConfigFromFile, type ConfigEnv } from 'vite';
import { ListrLogger, ListrLogLevels } from 'listr2';
import { LISTR_LOGGER_STYLES } from '../../constants.js';
import { createDebugAwareLogger } from '../debug-aware-logger.js';
import { colorStringify } from '../cli/colorStringify.js';
import { readFileSync } from 'fs';
import { logWarning } from '../warning-logger.js';

// NOTE: Removed ability to load config from context specific conigs, like vite.config.ui.ts, vite.config.main.ts, etc for now. If we wanted to implement it back, it should be done in this file based on context.

// Track if vite config warning has been shown to avoid spam
let viteConfigWarningShown = false;

/**
 * Checks if vite config uses the context parameter and shows migration warning if not
 */
function checkViteConfigForContextUsage(configPath: string) {
	if (viteConfigWarningShown) {
		return;
	}

	try {
		const configContent = readFileSync(configPath, 'utf-8');

		// Check if the config uses the context parameter
		const hasContextParameter =
			/defineConfig\s*\(\s*\(\s*\{\s*[^}]*context[^}]*\}/.test(configContent) ||
			/defineConfig\s*\(\s*\(\s*[^)]*context[^)]*\)/.test(configContent);

		if (!hasContextParameter) {
			viteConfigWarningShown = true;
			logWarning(
				'⚠️  Your vite.config file should use the context parameter to differentiate between main and UI builds.',
			);
			logWarning('Update your vite.config.ts file:');
			logWarning('');
			logWarning('  export default defineConfig(({ context }) => {');
			logWarning('    return {');
			logWarning("      plugins: context === 'ui' ? [react()] : []");
			logWarning('    };');
			logWarning('  });');
			logWarning('');
			logWarning(
				'See migration guide: https://github.com/gavinmcfarland/plugma/blob/main/docs/migration/v2/README.md',
			);
		}
	} catch (error) {
		// Ignore errors reading config file
	}
}

interface CustomConfigEnv extends ConfigEnv {
	context: 'main' | 'ui';
}

interface LoadConfigOptions {
	configName?: string;
	options: any;
	context: 'main' | 'ui';
	viteCommand: 'build' | 'serve';
}

export async function loadConfig({ configName, options, context, viteCommand }: LoadConfigOptions): Promise<any> {
	const logger = createDebugAwareLogger(options.debug);

	const configPaths = configName
		? [
				`${configName}.ts`,
				`${configName}.js`,
				`${configName}.mjs`,
				`${configName}.cjs`,
				`vite.config.ts`,
				`vite.config.js`,
				`vite.config.mjs`,
				`vite.config.cjs`,
			]
		: [`vite.config.ts`, `vite.config.js`, `vite.config.mjs`, `vite.config.cjs`];
	const existingConfigPath = configPaths.find((path) => existsSync(join(process.cwd(), path)));

	if (!existingConfigPath) {
		logger.log(ListrLogLevels.OUTPUT, `No Vite config found${configName ? ` for ${configName}` : ''}`);
		return null;
	}

	// Check for context parameter usage in vite config
	checkViteConfigForContextUsage(join(process.cwd(), existingConfigPath));

	const configEnv: CustomConfigEnv = {
		command: viteCommand,
		mode: options.mode,
		context,
	};

	try {
		const userConfig = await loadConfigFromFile(configEnv, existingConfigPath, process.cwd());

		if (options.debug && userConfig) {
			logger.log(ListrLogLevels.OUTPUT, `Logging user config ${existingConfigPath}`);
			console.log(colorStringify(userConfig, 2));
		}

		return userConfig;
	} catch (error) {
		logger.log(ListrLogLevels.FAILED, [
			'Warning: No Vite config found for',
			context,
			configName || 'default',
			error,
		]);

		return null;
	}
}
