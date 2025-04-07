import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const CONFIG_PATH = join(tmpdir(), 'plugma-test-config.json')

export interface TestConfig {
	port: number
}

export function setTestConfig(newConfig: TestConfig) {
	writeFileSync(CONFIG_PATH, JSON.stringify(newConfig))
}

export function getTestConfig(): TestConfig {
	try {
		const config = readFileSync(CONFIG_PATH, 'utf-8')
		return JSON.parse(config)
	} catch (error) {
		throw new Error('Test config not initialized')
	}
}
