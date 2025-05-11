import { loadEnvFiles } from '../utils/load-env-files.js'

loadEnvFiles()

import {
	BuildCommandOptions,
	createOptions,
	DEFAULT_OPTIONS,
	DevCommandOptions,
	PreviewCommandOptions,
	ReleaseCommandOptions,
	ReleaseType,
	AddCommandOptions,
} from '../utils/create-options.js'

import { readPlugmaPackageJson } from '../utils/fs/read-json.js'

import { Command } from 'commander'

import { build, dev, preview, release } from '../commands/index.js'
import { colorStringify, debugLogger, defaultLogger } from '../utils/index.js'
import chalk from 'chalk'
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
	.option('-p, --port <number>', 'Specify a port number for the dev server (default: random)', parseInt)
	.option('-m, --mode <mode>', `Specify the mode`, DEFAULT_OPTIONS.mode)
	.option('-o, --output <path>', `Specify the output directory`, DEFAULT_OPTIONS.output)
	.option('-ws, --websockets', `Enable websockets`, DEFAULT_OPTIONS.websockets)
	.option('-d, --debug', `Enable debug mode`, DEFAULT_OPTIONS.debug)
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
		dev(
			createOptions<'dev'>(options, {
				mode: 'development',
				command: 'dev',
			}),
		)
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
	.option('-p, --port <number>', 'Specify a port number for the dev server (default: random)', parseInt)
	.option('-m, --mode <mode>', `Specify the mode`, DEFAULT_OPTIONS.mode)
	.option('-o, --output <path>', `Specify the output directory`, DEFAULT_OPTIONS.output)
	.option('-d, --debug', `Enable debug mode`, DEFAULT_OPTIONS.debug)
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
		preview(
			createOptions<'preview'>(options, {
				mode: 'preview',
				command: 'preview',
				websockets: true,
			}),
		)
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
	.option('-w, --watch', `Watch for changes and rebuild automatically`, DEFAULT_OPTIONS.watch)
	.option('-m, --mode <mode>', `Specify the mode`, DEFAULT_OPTIONS.mode)
	.option('-o, --output <path>', `Specify the output directory`, DEFAULT_OPTIONS.output)
	.option('-d, --debug', `Enable debug mode`, DEFAULT_OPTIONS.debug)
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
		build(
			createOptions<'build'>(options, {
				mode: 'production',
				command: 'build',
			}),
		)
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
	.option('--title <title>', 'Specify a title for the release')
	.option('--notes <notes>', 'Specify release notes')
	.option('-d, --debug', `Enable debug mode`, DEFAULT_OPTIONS.debug)
	.option('-o, --output <path>', `Specify the output directory`, DEFAULT_OPTIONS.output)
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
			mode: options.mode,
			instanceId: options.instanceId,
			cwd: options.cwd,
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
	.action(async function (this: Command, options: Partial<AddCommandOptions>) {
		await add(
			createOptions<'add'>(options, {
				command: 'add',
			}),
		)
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
