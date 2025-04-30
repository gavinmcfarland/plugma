import { existsSync } from 'fs'
import { Logger } from '../../utils/log/logger.js'
import { join } from 'node:path'
import { loadConfigFromFile, type ConfigEnv } from 'vite'
import { PluginOptions } from '../../core/types'
import { colorStringify } from '../cli/colorStringify.js'

interface CustomConfigEnv extends ConfigEnv {
	context: 'main' | 'ui'
}

export async function loadConfig(configName: string, options: PluginOptions, context: 'main' | 'ui'): Promise<any> {
	const log = new Logger({ debug: options.debug })

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
		log.debug(`No Vite config found for ${configName}`)
		return null
	}
	console.log(options.mode, process.env.NODE_ENV, 'development')
	console.log(options.mode || process.env.NODE_ENV || 'development')
	const configEnv: CustomConfigEnv = {
		command: 'build',
		mode: options.mode || process.env.NODE_ENV || 'development',
		context,
	}

	try {
		const userConfig = await loadConfigFromFile(configEnv, existingConfigPath, process.cwd())

		return userConfig
	} catch (error) {
		// console.warn(`Warning: No Vite config found for ${context}`, configName, error)

		return null
	}
}
