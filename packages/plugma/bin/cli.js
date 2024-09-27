#! /usr/bin/env node

import cli from '../scripts/run-script.js'
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
		.option('t', {
			alias: 'toolbar',
			description: 'Display the developer toolbar within the plugin UI',
			type: 'boolean'
		})
		.option('m', {
			alias: 'mode',
			description: 'Specify the mode (development, production, test)',
			type: 'string',
			choices: ['development', 'production', 'test'],
			default: 'development'
		})
		.example(
			"$0 dev -p 3000 --mode development",
			"Runs a dev server on port 3000 in development mode"
		)
		.argv;
}).command('build', 'Create a build ready for publishing', function (yargs) {
	yargs
		.option('w', {
			alias: 'watch',
			description: 'Watch for changes and rebuild automatically',
			type: 'boolean'
		})
		.option('m', {
			alias: 'mode',
			description: 'Specify the mode (development, production, test)',
			type: 'string',
			choices: ['development', 'production', 'test'],
			default: 'production'
		})
		.example(
			"$0 build --mode production",
			"Creates a build in production mode"
		)
		.argv;
})

cli(yargs.argv);
