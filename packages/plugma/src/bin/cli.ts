import { readPlugmaPackageJson } from '../utils/fs/read-json.js'

import { Command } from 'commander'

import {
	type BuildCommandOptions,
	type DevCommandOptions,
	type PreviewCommandOptions,
	type ReleaseCommandOptions,
	type TestCommandOptions,
	build,
	dev,
	preview,
	release,
} from '../commands/index.js'
import { colorStringify, debugLogger, defaultLogger } from '../utils/index.js'
import chalk from 'chalk'
import type { ReleaseType } from './types.js'
import { add } from '../commands/add.js'
import { suppressLogs } from '../utils/suppress-logs.js'

// Read package.json to get the version
const packageJson = await readPlugmaPackageJson()
const version = packageJson.version

// Initialize Commander
const program = new Command()

// Set version for the program
program
	.name('plugma')
	.description('A modern Figma plugin development toolkit')
	.version(version, '-v, --version', 'Output the current version')
	.addHelpText('beforeAll', `${chalk.blue.bold('Plugma')} ${chalk.grey(`v${version}`)}\n`)

// Global Debug Option
const handleDebug = async (command: string, options: Record<string, any> & { debug?: boolean }): Promise<void> => {
	if (options.debug) {
		process.env.PLUGMA_DEBUG = 'true'
		defaultLogger.setOptions({ debug: true })
		debugLogger.info('Debug mode enabled - preloading source maps...')

		// Preload source maps before any logging occurs
		const { preloadSourceMaps } = await import('../utils/fs/map-to-source.js')
		await preloadSourceMaps()

		debugLogger.info(`command: ${command}`)
		debugLogger.info(`arguments: ${colorStringify(options)}\n`)
	}
}

// Dev Command
program
	.command('dev')
	.description('Start a server to develop your plugin')
	.addHelpText(
		'after',
		'\nStart a server to develop your plugin. This command builds the ui.html and points it to the dev server making it easier to develop and debug your plugin.',
	)
	.option('-p, --port <number>', 'Specify a port number for the plugin preview', parseInt)
	.option('-m, --mode <mode>', 'Specify the mode', 'development')
	.option('-o, --output <path>', 'Specify the output directory', 'dist')
	.option('-ws, --websockets', 'Enable websockets', false)
	.option('-d, --debug', 'Enable debug mode', false)
	.option('-c, --config <json>', 'Specify a JSON configuration object for testing and debugging', (value) => {
		try {
			return JSON.parse(value)
		} catch (e) {
			console.error('Invalid JSON configuration:', e)
			process.exit(1)
		}
	})
	.action(function (this: Command, options: DevCommandOptions) {
		handleDebug(this.name(), options)
		suppressLogs(options)
		dev(options)
	})
	.addHelpText(
		'after',
		`
    Examples:
      plugma dev --port 3000 --websockets
      plugma dev --mode test
      plugma dev --config '{"testMode": true, "mockData": {"key": "value"}}'
  `,
	)

// Preview Command
program
	.command('preview')
	.description('Preview your plugin')
	.addHelpText(
		'after',
		'\nPreview your plugin in any browser to see how it looks and works. Make sure the plugin is open in the Figma desktop app for this to work.',
	)
	.option('-p, --port <number>', 'Specify a port number for the plugin preview', parseInt)
	.option('-m, --mode <mode>', 'Specify the mode', 'development')
	.option('-o, --output <path>', 'Specify the output directory', 'dist')
	.option('-d, --debug', 'Enable debug mode', false)
	.option('-c, --config <json>', 'Specify a JSON configuration object for testing and debugging', (value) => {
		try {
			return JSON.parse(value)
		} catch (e) {
			console.error('Invalid JSON configuration:', e)
			process.exit(1)
		}
	})
	.action(function (this: Command, options: PreviewCommandOptions) {
		handleDebug(this.name(), options)
		suppressLogs(options)
		preview(options)
	})
	.addHelpText(
		'after',
		`
    Examples:
      plugma preview --port 3000
      plugma preview --config '{"testMode": true, "mockData": {"key": "value"}}'
  `,
	)

// Build Command
program
	.command('build')
	.description('Create a build ready for publishing')
	.addHelpText('after', '\nThis command compiles and bundles your plugin, preparing it for distribution.')
	.option('-w, --watch', 'Watch for changes and rebuild automatically')
	.option('-m, --mode <mode>', 'Specify the mode', 'production')
	.option('-o, --output <path>', 'Specify the output directory', 'dist')
	.option('-d, --debug', 'Enable debug mode', false)
	.option('-c, --config <json>', 'Specify a JSON configuration object for testing and debugging', (value) => {
		try {
			return JSON.parse(value)
		} catch (e) {
			console.error('Invalid JSON configuration:', e)
			process.exit(1)
		}
	})
	.action(function (this: Command, options: BuildCommandOptions) {
		handleDebug(this.name(), options)
		suppressLogs(options)
		build(options)
	})
	.addHelpText(
		'after',
		`
    Examples:
      plugma build --watch
      plugma build --config '{"testMode": true, "mockData": {"key": "value"}}'
  `,
	)

// Release Command
program
	.command('release')
	.argument('[type]', 'Release type or version number', 'stable')
	.description('Prepare a release for your plugin')
	.option('-t, --title <title>', 'Specify a title for the release')
	.option('-n, --notes <notes>', 'Specify release notes')
	.option('-d, --debug', 'Enable debug mode', false)
	.option('-o, --output <path>', 'Specify the output directory', 'dist')
	.option('-c, --config <json>', 'Specify a JSON configuration object for testing and debugging', (value) => {
		try {
			return JSON.parse(value)
		} catch (e) {
			console.error('Invalid JSON configuration:', e)
			process.exit(1)
		}
	})
	.action(function (this: Command, type: string, options: ReleaseCommandOptions) {
		handleDebug(this.name(), { ...options, type })

		const validReleaseTypes: ReleaseType[] = ['alpha', 'beta', 'stable'] as const
		const releaseOptions: ReleaseCommandOptions = {
			command: 'release',
			title: options.title,
			notes: options.notes,
			output: options.output,
			debug: options.debug,
			config: options.config,
		}

		if (validReleaseTypes.includes(type as (typeof validReleaseTypes)[number])) {
			releaseOptions.type = type as (typeof validReleaseTypes)[number]
		} else if (/^\d+$/.test(type)) {
			releaseOptions.version = type
		} else {
			console.error('Invalid version: must be a whole integer or a release type (alpha, beta, stable)')
			process.exit(1)
		}

		release(releaseOptions)
	})
	.addHelpText(
		'after',
		`
    Examples:
      plugma release
      plugma release alpha --title "Alpha Release" --notes "Initial alpha release"
      plugma release --config '{"testMode": true, "mockData": {"key": "value"}}'
  `,
	)

// Add Command
program
	.command('add')
	.argument('[integration]', 'Integration to add', 'playwright')
	.option('-c, --config <json>', 'Specify a JSON configuration object for testing and debugging', (value) => {
		try {
			return JSON.parse(value)
		} catch (e) {
			console.error('Invalid JSON configuration:', e)
			process.exit(1)
		}
	})
	.action(async function (this: Command, integration: string, options: { config?: any }) {
		await add({ integration })
	})
	.addHelpText(
		'after',
		`
    Examples:
      plugma add playwright
      plugma add playwright --config '{"testMode": true, "mockData": {"key": "value"}}'
  `,
	)

// Parse arguments
program.parse(process.argv)
