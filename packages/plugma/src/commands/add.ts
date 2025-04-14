/**
 * Add new integrations to Plugma
 */

import { Logger } from '#utils/log/logger.js'
import { exec } from 'child_process'
import { detect } from 'package-manager-detector/detect'
import { resolveCommand } from 'package-manager-detector/commands'
import { select, intro, outro, isCancel, spinner, note, confirm } from '@clack/prompts'
import { runIntegration } from '../integrations/define-integration.js'
import playwrightIntegration from '../integrations/playwright.js'
import tailwindIntegration from '../integrations/tailwind.js'
import shadcnIntegration from '../integrations/shadcn.js'
import chalk from 'chalk'
import type { Integration } from '../integrations/define-integration.js'
// Import other integrations here...

interface AddCommandOptions {
	integration?: string
	debug?: boolean
}

// Define available integrations and their types
const INTEGRATIONS = {
	playwright: playwrightIntegration,
	tailwind: tailwindIntegration,
	shadcn: shadcnIntegration,
	// Add other integrations here...
} as const

type IntegrationKey = keyof typeof INTEGRATIONS

async function installRequiredIntegrations(integration: Integration): Promise<boolean> {
	if (!integration.requires?.length) return true

	const requiredIntegrations = integration.requires.map((id) => INTEGRATIONS[id as IntegrationKey])

	note(
		`${integration.name} requires the following integrations:\n` +
			requiredIntegrations.map((int: Integration) => `  • ${int.name}`).join('\n'),
		'Required Integrations',
	)

	const shouldInstall = await confirm({
		message: 'Would you like to install the required integrations first?',
		initialValue: true,
	})

	if (isCancel(shouldInstall) || !shouldInstall) {
		return false
	}

	// Install each required integration
	for (const requiredId of integration.requires) {
		const requiredIntegration = INTEGRATIONS[requiredId as IntegrationKey]
		const result = await runIntegration(requiredIntegration)

		if (!result) {
			return false
		}

		// Install dependencies for the required integration
		if (result.dependencies.length > 0 || result.devDependencies.length > 0) {
			const s = spinner()
			s.start(`Installing dependencies for ${requiredIntegration.name}...`)
			try {
				await installDependencies(result.dependencies, result.devDependencies)
				s.stop('Dependencies installed successfully!')
			} catch (error) {
				s.stop('Failed to install dependencies')
				throw error
			}
		}
	}

	return true
}

export async function add(options: AddCommandOptions): Promise<void> {
	const log = new Logger({ debug: options.debug })

	try {
		intro('Adding integration to your project')

		const selectedIntegration = await select({
			message: 'What would you like to add?',
			options: Object.entries(INTEGRATIONS).map(([value, integration]) => ({
				value,
				label: integration.name,
				hint: integration.description,
			})),
		})

		if (isCancel(selectedIntegration)) {
			outro('Operation cancelled')
			process.exit(0)
		}

		const integration = INTEGRATIONS[selectedIntegration as IntegrationKey]

		// Handle required integrations first
		const requiredInstalled = await installRequiredIntegrations(integration)
		if (!requiredInstalled) {
			outro('Operation cancelled')
			process.exit(0)
		}

		const result = await runIntegration(integration)

		if (!result) {
			outro('Operation cancelled')
			process.exit(0)
		}

		// Install dependencies
		if (result.dependencies.length > 0 || result.devDependencies.length > 0) {
			const shouldInstall = await confirm({
				message: 'Install dependencies?',
				initialValue: true,
			})

			if (isCancel(shouldInstall)) {
				outro('Operation cancelled')
				process.exit(0)
			}

			if (shouldInstall) {
				const s = spinner()
				s.start('Installing dependencies...')
				try {
					await installDependencies(result.dependencies, result.devDependencies)
					s.stop('Dependencies installed successfully!')
				} catch (error) {
					s.stop('Failed to install dependencies')
					throw error
				}
			} else {
				note(
					`${chalk.bold('You can install the dependencies later by running:')}\n\n` +
						`${chalk.cyan('Regular dependencies:')}\n${result.dependencies.map((dep) => `  • ${chalk.green(dep)}`).join('\n')}\n\n` +
						`${chalk.cyan('Dev dependencies:')}\n${result.devDependencies.map((dep) => `  • ${chalk.yellow(dep)}`).join('\n')}`,
					'Dependencies to install',
				)
			}
		}

		// Show next steps
		if (result.nextSteps) {
			note(Array.isArray(result.nextSteps) ? result.nextSteps.join('\n') : result.nextSteps, 'Next steps')
		}

		outro('Integration added successfully!')
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		log.error('Failed to add integration:', errorMessage)
		throw error
	}
}

async function installDependencies(dependencies: string[], devDependencies: string[]): Promise<void> {
	const pm = await detect({ cwd: process.cwd() })
	if (!pm) throw new Error('Could not detect package manager')

	return new Promise((resolve, reject) => {
		const resolved = resolveCommand(pm.agent, 'add', [...dependencies, ...devDependencies])
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
