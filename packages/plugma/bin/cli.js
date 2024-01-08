#! /usr/bin/env node

// const cli = require("../dist/cli.js")
import cli from '../scripts/runDevScript.js'

import _yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
const yargs = _yargs(hideBin(process.argv));

yargs.scriptName("plugma")
	.usage('Usage: $0 <cmd> [args] -b [path]')
	.help()

yargs.command('dev', 'Develop your plugin', (yargs) => {
	yargs.positional('name', {
		type: 'string',
		default: '',
		describe: 'semver to increment',
		choices: ['patch', 'minor', 'major', '']
	})
}, function (argv) {
	// console.log('[plugma]', argv.name)
}).option('port', {
	describe: 'Speficy a port for the plugin preview'
})

yargs.command('build', 'Publish or share your plugin', (yargs) => {
	yargs.positional('name', {
		type: 'string',
		default: '',
		describe: 'semver to increment',
		choices: ['patch', 'minor', 'major', '']
	})
}, function (argv) {
	// console.log('[plugma]', argv.name)
}).option('port', {
	describe: 'Speficy a port for the plugin preview'
})


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

console.log(yargs.argv)
cli(yargs.argv)

