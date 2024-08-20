#! /usr/bin/env node

// const cli = require("../dist/cli.js")
import cli from '../scripts/runDevScript.js'

import _yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
const yargs = _yargs(hideBin(process.argv));

yargs.scriptName("plugma")
	.usage('Usage: $0 <cmd> [opts]')

yargs.command('dev', 'Start a server to develop your plugin', function (yargs) {
	yargs
		.option('p', {
			alias: 'port',
			description: 'Specify a port number for the plugin preview',
			type: 'number'
		})
		.example(
			"$0 dev -p 3000",
			"Runs a dev server on port 3000"
		)
		.option('t', {
			alias: 'toolbar',
			description: 'Display the developer toolbar within the plugin UI',
			type: 'boolean'
		})
		.example(
			"$0 dev -t",
			"Displays the developer toolbar within the plugin UI"
		)
		.argv;
}).command('build', 'Create a build ready for publishing', function (yargs) {
	yargs
		.option('w', {
			description: 'Watch for changes and rebuild automatically',
			alias: 'watch',
			type: 'boolean'
		})
		.example(
			"$0 build -w",
			"Creates a build and watches for changes"
		)
		.argv;
})
// .example(
// 	"$0 build",
// 	"Creates a build ready for publishing"
// )

// .option('w', {
// 	alias: 'watch',
// 	describe: 'Watch for changes and rebuild automatically',
// 	type: 'boolean',
// })


// const options = yargs.scriptName("plugma")
// .usage('Usage: $0 <cmd> [args] -b [path]')
// .command('dev', 'Develop your plugin', (yargs) => {
// 	yargs.positional('name', {
// 		type: 'string',
// 		default: '',
// 		describe: 'semver to increment',
// 		choices: ['patch', 'minor', 'major', '']
// 	})
// }, function (argv) {
// 	// console.log('[plugma]', argv.name)
// })
// .command('build', 'Publish or share your plugin', (yargs) => {
// 	yargs.positional('name', {
// 		type: 'string',
// 		default: '',
// 		describe: 'semver to increment',
// 		choices: ['patch', 'minor', 'major', '']
// 	})
// }, function (argv) {
// 	// console.log('[plugma]', argv.name)
// })
// .option('port', {
// 	describe: 'Speficy a port for the plugin preview'
// })
// .help()
// .argv

// yargs
// 	.completion('completion', function (current, argv) {
// 		// 'current' is the current command being completed.
// 		// 'argv' is the parsed arguments so far.
// 		// simply return an array of completions.
// 		return [
// 			'foo',
// 			'bar'
// 		];
// 	})
// 	.argv;

// .command('version [name]', '', (yargs) => {
// 	yargs.positional('name', {
// 		type: 'string',
// 		default: '',
// 		describe: 'semver to increment',
// 		choices: ['patch', 'minor', 'major', '']
// 	})
// }, function (argv) {
// 	// console.log('[plugma]', argv.name)
// })

cli(yargs.argv)

