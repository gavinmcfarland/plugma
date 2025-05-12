import { existsSync } from 'fs'
import { join } from 'node:path'
import { loadConfigFromFile, type ConfigEnv } from 'vite'
import { ListrLogger, ListrLogLevels } from 'listr2'
import { LISTR_LOGGER_STYLES } from '../../constants.js'
import { createDebugAwareLogger } from '../debug-aware-logger.js'

interface CustomConfigEnv extends ConfigEnv {
	context: 'main' | 'ui'
}

export async function loadConfig(configName: string, options: any, context: 'main' | 'ui'): Promise<any> {
	const logger = createDebugAwareLogger(options.debug)

	const configPaths = [
		`${configName}.ts`,
		`${configName}.js`,
		`${configName}.mjs`,
		`${configName}.cjs`,
		`vite.config.ts`,
		`vite.config.js`,
		`vite.config.mjs`,
		`vite.config.cjs`,
	]
	const existingConfigPath = configPaths.find((path) => existsSync(join(process.cwd(), path)))

	if (!existingConfigPath) {
		logger.log(ListrLogLevels.OUTPUT, `No Vite config found for ${configName}`)
		return null
	}

	const configEnv: CustomConfigEnv = {
		command: 'build',
		mode: options.mode || process.env.NODE_ENV || 'development',
		context,
	}

	try {
		const userConfig = await loadConfigFromFile(configEnv, existingConfigPath, process.cwd())

		return userConfig
	} catch (error) {
		logger.log(ListrLogLevels.FAILED, ['Warning: No Vite config found for', context, configName, error])

		return null
	}
}
