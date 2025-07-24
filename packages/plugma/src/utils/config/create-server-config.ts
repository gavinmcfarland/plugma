import type { InlineConfig } from 'vite'
import { mergeConfig } from 'vite'
import { loadConfig } from './load-config.js'
import type { DevCommandOptions, PreviewCommandOptions } from '../../utils/create-options.js'
import type { UserFiles } from '../../core/types.js'

/**
 * Creates a standardized server configuration for Vite development server
 * This function is shared between start-dev-server and restart-dev-server tasks
 * to ensure consistent configuration and avoid code duplication.
 */
export async function createViteServerConfig(
	options: DevCommandOptions | PreviewCommandOptions,
	files: UserFiles,
	configs: any,
): Promise<InlineConfig> {
	const baseConfig = {
		...configs.ui.dev,
		root: process.cwd(),
		base: '/',
		server: {
			port: options.port,
			strictPort: true,
			cors: true,
			host: 'localhost',
			middlewareMode: false,
			sourcemapIgnoreList: () => true,
			hmr: {
				port: options.port,
				protocol: 'ws',
				host: 'localhost',
			},
			fs: {
				strict: false,
				allow: ['.'],
			},
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
				'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Range',
				'Access-Control-Expose-Headers': 'Content-Range',
			},
		},
		optimizeDeps: {
			entries: [files.manifest.ui || '', files.manifest.main || ''].filter(Boolean),
			force: true,
		},
		clearScreen: false,
		logLevel: (options.debug ? 'info' : 'error') as any,
	}

	const userUIConfig = await loadConfig('vite.config.ui', options, 'ui', 'serve')

	return mergeConfig(
		{
			configFile: false,
			...baseConfig,
		},
		userUIConfig?.config ?? {},
	)
}
