import { loadEnvFiles } from '../utils/load-env-files.js'

loadEnvFiles()

import {
	BuildCommandOptions,
	createOptions,
	DEFAULT_OPTIONS,
	DevCommandOptions,
	PreviewCommandOptions,
	ReleaseCommandOptions,
	AddCommandOptions,
} from '../utils/create-options.js'

import { readPlugmaPackageJson } from '../utils/fs/read-json.js'

import { Command } from 'commander'

import { build, dev } from '../commands/index.js'
import { colorStringify, debugLogger, defaultLogger } from '../utils/index.js'
import chalk from 'chalk'
import { add } from '../commands/add.js'
import { suppressLogs } from '../utils/suppress-logs.js'
import { ListrLogLevels } from 'listr2'
import { createDebugAwareLogger } from '../utils/debug-aware-logger.js'
import { showPlugmaPrompt } from '../utils/show-plugma-prompt.js'
import { preview } from '../commands/preview.js'
import { release } from '../commands/release.js'

const logger = createDebugAwareLogger()

// Read package.json to get the version
const packageJson = await readPlugmaPackageJson()
const version = packageJson.version

// Global Debug Option
const handleDebug = async (command: string, options: Record<string, any> & { debug?: boolean }): Promise<void> => {
	if (options.debug) {
		process.env.PLUGMA_DEBUG = 'true'
		logger.log(ListrLogLevels.OUTPUT, 'Debug mode enabled - preloading source maps...')

		// Preload source maps before any logging occurs
		const { preloadSourceMaps } = await import('../utils/fs/map-to-source.js')
		await preloadSourceMaps()

		logger.log(ListrLogLevels.OUTPUT, `User command: ${command}`)
		logger.log(ListrLogLevels.OUTPUT, `User options:${colorStringify(options)}\n`)
	}
}

// Initialize Commander
const program = new Command()

program
	.name('plugma')
	.description('A modern Figma plugin development toolkit')
	.version(version, '-v, --version', 'Output the current version')
	.addHelpText('beforeAll', `${chalk.blue.bold('Plugma')} ${chalk.grey(`v${version}`)}\n`)

// Add a hook that runs before every command
program.hook('preAction', async (thisCommand, actionCommand) => {
	// This will run before any command execution
	const commandName = actionCommand.name()
	const options = actionCommand.opts()

	// You can add your common functionality here
	await handleDebug(commandName, options)
	if (options.output) {
		suppressLogs(options)
	}
	await showPlugmaPrompt()
})

program
	.command('dev')
	.description('Start a dev server to develop your plugin')
	.option('-p, --port <number>', 'Specify a port number for the dev server (default: random)', parseInt)
	.option('-m, --mode <mode>', `Specify the mode`, DEFAULT_OPTIONS.mode)
	.option('-o, --output <path>', `Specify the output directory`, DEFAULT_OPTIONS.output)
	.option('--no-websockets', `Disable websockets`, !DEFAULT_OPTIONS.websockets)
	.option('--dock-plugin', `Dock the plugin in the Figma UI`, DEFAULT_OPTIONS.dockPlugin)
	.option('-d, --debug', `Enable debug mode`, DEFAULT_OPTIONS.debug)
	.option(
		'-c, --config <json>',
		'Specify a JSON configuration object for testing and debugging',
		DEFAULT_OPTIONS.configParser,
	)
	.action(function (this: Command, options: DevCommandOptions) {
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
	.description('Preview your plugin in any browser')
	.option('-p, --port <number>', 'Specify a port number for the dev server (default: random)', parseInt)
	.option('-m, --mode <mode>', `Specify the mode`, DEFAULT_OPTIONS.mode)
	.option('-o, --output <path>', `Specify the output directory`, DEFAULT_OPTIONS.output)
	.option('-d, --debug', `Enable debug mode`, DEFAULT_OPTIONS.debug)
	.option(
		'-c, --config <json>',
		'Specify a JSON configuration object for testing and debugging',
		DEFAULT_OPTIONS.configParser,
	)
	.action(function (this: Command, options: PreviewCommandOptions) {
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
	.description('Bundle and minify your plugin, preparing it for distribution')
	.option('-w, --watch', `Watch for changes and rebuild automatically`, DEFAULT_OPTIONS.watch)
	.option('-m, --mode <mode>', `Specify the mode`, DEFAULT_OPTIONS.mode)
	.option('-o, --output <path>', `Specify the output directory`, DEFAULT_OPTIONS.output)
	.option('-d, --debug', `Enable debug mode`, DEFAULT_OPTIONS.debug)
	.option(
		'-c, --config <json>',
		'Specify a JSON configuration object for testing and debugging',
		DEFAULT_OPTIONS.configParser,
	)
	.action(function (this: Command, options: BuildCommandOptions) {
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
	.description('Build and publish a release of your plugin to GitHub')
	.option('--title <title>', 'Specify a title for the release')
	.option('--notes <notes>', 'Specify release notes')
	.option('-d, --debug', `Enable debug mode`, DEFAULT_OPTIONS.debug)
	.option('-o, --output <path>', `Specify the output directory`, DEFAULT_OPTIONS.output)
	.option(
		'-c, --config <json>',
		'Specify a JSON configuration object for testing and debugging',
		DEFAULT_OPTIONS.configParser,
	)
	.action(function (this: Command, type: string, options: ReleaseCommandOptions) {
		release(
			createOptions<'release'>(options, {
				command: 'release',
			}),
		)
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
	.option(
		'-c, --config <json>',
		'Specify a JSON configuration object for testing and debugging',
		DEFAULT_OPTIONS.configParser,
	)
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
