#! /usr/bin/env node

// const cli = require("../dist/cli.js")
import cli from '../scripts/runDevScript.js'

import _yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
const yargs = _yargs(hideBin(process.argv));

yargs.scriptName("plugma")
	.usage('Usage: $0 <cmd> [opts]')
	.help()

yargs.command('dev', 'Develop your plugin')
	.example(
		"$0 dev -p 3000",
		"Runs a dev server on port 3000"
	)
	.option('p', {
		alias: 'port',
		describe: 'Speficy the port for the plugin preview',
		type: 'number',
		nargs: 1
	})


yargs.command('build', 'Publish or share your plugin')
	.example(
		"$0 build",
		"Creates a build ready for publishing"
	)


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

