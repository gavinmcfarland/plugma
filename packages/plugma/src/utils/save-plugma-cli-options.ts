import { writeFileSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const CONFIG_PATH = join(tmpdir(), 'plugma-test-config.json')

export function setConfig(newConfig: any) {
	writeFileSync(CONFIG_PATH, JSON.stringify(newConfig))
}

export function getConfig(): any {
	try {
		const config = readFileSync(CONFIG_PATH, 'utf-8')
		return JSON.parse(config)
	} catch (error) {
		throw new Error('Config not initialized')
	}
}

export function clearConfig() {
	try {
		unlinkSync(CONFIG_PATH)
	} catch (error) {
		// Ignore error if file doesn't exist
	}
}
