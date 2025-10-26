import { writeFileSync, readFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { cwd } from 'node:process'

// Create a project-specific config path using the current working directory
const CONFIG_PATH = join(tmpdir(), `plugma-test-config-${Buffer.from(cwd()).toString('base64url')}.json`)

// console.log('CONFIG_PATH', CONFIG_PATH)

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
