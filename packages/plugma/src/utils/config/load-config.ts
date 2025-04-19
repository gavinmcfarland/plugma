import { existsSync } from 'fs'
import { Logger } from '../../utils/log/logger.js'
import { join } from 'node:path'
import { loadConfigFromFile, type ConfigEnv } from 'vite'
import { PluginOptions } from '../../core/types'

interface CustomConfigEnv extends ConfigEnv {
	context: 'main' | 'ui'
}

export async function loadConfig(configName: string, options: PluginOptions, context: 'main' | 'ui') {
	const log = new Logger({ debug: options.debug })

	const configPaths = [`${configName}.ts`, `${configName}.js`, `${configName}.mjs`, `${configName}.cjs`]
	const existingConfigPath = configPaths.find((path) => existsSync(join(process.cwd(), path)))

	if (!existingConfigPath) {
		log.debug(`No Vite config found for ${configName}`)
		return null
	}

	const configEnv: CustomConfigEnv = {
		command: 'build',
		mode: options.mode || process.env.NODE_ENV || 'development',
		context,
	}

	const userConfig = await loadConfigFromFile(configEnv, existingConfigPath, process.cwd())

	if (userConfig) {
		log.debug(`Loaded Vite config from ${existingConfigPath} with context: ${context}`)
	}

	return userConfig
}
