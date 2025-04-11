/**
 * Add new intergrations to Plugma
 */

import { Logger } from '#utils/log/logger.js'
import { exec } from 'child_process'
import { detect } from 'package-manager-detector/detect'
import { resolveCommand } from 'package-manager-detector/commands'

interface AddCommandOptions {
	integration?: string
	debug?: boolean
	createExamples?: boolean
	installDependencies?: boolean
}

export async function add(options: AddCommandOptions): Promise<void> {
	const log = new Logger({ debug: options.debug })

	try {
		log.info('Adding a new integration...')

		const integration = options.integration

		if (!integration) {
			throw new Error('Integration is required')
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		log.error('Failed to add a new integration:', errorMessage)
		throw error
	}
}

export async function initIntegration(integration: string) {
	if (integration === 'playwright') {
		// Generate Playwright configuration
		// execSync('npx playwright codegen --target=python --output=playwright.config.ts', { stdio: 'inherit' })
		await import('../integrations/init-playwright-config.js').then((config) => {
			config.initConfig()
		})
	}
}

export async function addExamples(integration: string) {
	if (integration === 'playwright') {
		await import('../integrations/init-playwright-test-examples.js').then((config) => {
			console.log('Adding examples...')
			config.initConfig()
		})
	}
}

export async function installDependencies(integration: string): Promise<void> {
	if (integration === 'playwright') {
		// Install Playwright test framework
		const pm = await detect({ cwd: process.cwd() })
		if (!pm) throw new Error('Could not detect package manager')
		return new Promise((resolve, reject) => {
			const resolved = resolveCommand(pm.agent, 'add', ['@playwright/test'])
			if (!resolved) throw new Error('Could not resolve package manager command')
			exec(`${resolved.command} ${resolved.args.join(' ')}`, (error) => {
				if (error) {
					reject(error)
				} else {
					resolve()
				}
			})
		})
	}
}
